"""Voice AI Agent — Web-facing FastAPI server with role-aware WebSocket.

Provides:
  - POST /chat           → Text-based chat (existing Agnes endpoint)
  - WS   /ws/voice       → Real-time voice session with role-aware personas
  - GET  /health         → Health check

All API keys are loaded from the .env file in the project root.
"""

import os
import sys
import json
import asyncio
import logging
from typing import Optional

from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ──────────────────────────────────────────────
# Bootstrap
# ──────────────────────────────────────────────

env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Role-Specific System Prompts
# ──────────────────────────────────────────────

STUDENT_SYSTEM_PROMPT = (
    "You are Agnes — an adaptive, friendly AI learning companion "
    "for students.\n\n"
    "YOUR ROLE:\n"
    "- Help students understand concepts, prepare for quizzes, and simplify "
    "complex topics.\n"
    "- Provide step-by-step explanations using analogies and examples.\n"
    "- Run rapid-fire quiz sessions when requested.\n"
    "- Encourage and motivate the student.\n\n"
    "RULES:\n"
    "1. Multilingual: Detect user language (English, Hindi, Kannada, "
    "code-mixed) and reply in the same language.\n"
    "2. Keep responses concise and spoken-audio friendly (no markdown, "
    "no bullet lists).\n"
    "3. If unsure, say so honestly. Never fabricate facts.\n"
    "4. You do NOT have access to educator tools like grading, analytics, "
    "or course management. If asked, politely redirect.\n"
    "5. Focus on learning assistance: concept explanations, doubt clearing, "
    "exam prep, flashcard drills.\n"
)

EDUCATOR_SYSTEM_PROMPT = (
    "You are Agnes — an intelligent Teaching Assistant AI for educators.\n\n"
    "YOUR ROLE:\n"
    "- Help educators with grading overviews, course analytics, student "
    "performance stats, and assignment creation.\n"
    "- Provide actionable insights on class-wide performance trends.\n"
    "- Help draft assignments, rubrics, and lesson plans.\n"
    "- Summarize student progress and flag at-risk learners.\n\n"
    "RULES:\n"
    "1. Multilingual: Detect user language and reply in the same language.\n"
    "2. Keep responses concise and spoken-audio friendly (no markdown, "
    "no bullet lists).\n"
    "3. If unsure, say so honestly. Never fabricate facts.\n"
    "4. You do NOT have access to student-specific learning tools like "
    "flashcards, games, or exam prep. If asked, politely redirect.\n"
    "5. Focus on teaching assistance: analytics, grading, student management, "
    "course planning.\n"
)

# Role-specific tool schemas (extend as needed)
STUDENT_TOOLS = [
    {
        "name": "explain_topic",
        "description": "Provides a detailed explanation of a topic",
        "risk_level": "safe",
    },
    {
        "name": "quiz_me",
        "description": "Generates quiz questions on a topic",
        "risk_level": "safe",
    },
]

EDUCATOR_TOOLS = [
    {
        "name": "get_class_analytics",
        "description": "Retrieves class-wide performance analytics",
        "risk_level": "safe",
    },
    {
        "name": "student_performance",
        "description": "Gets individual student performance summary",
        "risk_level": "safe",
    },
    {
        "name": "create_assignment",
        "description": "Drafts a new assignment",
        "risk_level": "confirm",
    },
]


def get_prompt_for_role(role: str) -> str:
    """Return the system prompt based on user role."""
    if role == "educator":
        return EDUCATOR_SYSTEM_PROMPT
    return STUDENT_SYSTEM_PROMPT


def get_tools_for_role(role: str) -> list:
    """Return the available tool schemas based on user role."""
    if role == "educator":
        return EDUCATOR_TOOLS
    return STUDENT_TOOLS


# ──────────────────────────────────────────────
# Agnes AI Client
# ──────────────────────────────────────────────

from openai import OpenAI, APITimeoutError

AGNES_API_KEY = os.getenv("AGNES_API_KEY", "")
AGNES_BASE_URL = os.getenv("AGNES_BASE_URL", "https://apihub.agnes-ai.com/v1")
AGNES_MODEL = os.getenv("AGNES_MODEL", "agnes-2.5-flash")

if not AGNES_API_KEY or AGNES_API_KEY.startswith("your_"):
    logger.warning("⚠️  AGNES_API_KEY not set — LLM calls will fail.")

client = OpenAI(
    api_key=AGNES_API_KEY,
    base_url=AGNES_BASE_URL,
    timeout=20.0,
    max_retries=0,
)

# ──────────────────────────────────────────────
# FastAPI App
# ──────────────────────────────────────────────

app = FastAPI(title="Voice AI Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Models
# ──────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    role: str = "student"  # 'student' | 'educator'


# ──────────────────────────────────────────────
# Session State (per WebSocket)
# ──────────────────────────────────────────────

class VoiceSession:
    """Holds per-connection state for a voice session."""

    def __init__(self, role: str, user_id: str):
        self.role = role
        self.user_id = user_id
        self.system_prompt = get_prompt_for_role(role)
        self.tools = get_tools_for_role(role)
        self.history = [{"role": "system", "content": self.system_prompt}]

    def add_user_message(self, text: str):
        self.history.append({"role": "user", "content": text})

    def add_assistant_message(self, text: str):
        self.history.append({"role": "assistant", "content": text})

    def reset(self):
        self.history = [{"role": "system", "content": self.system_prompt}]


# ──────────────────────────────────────────────
# REST Endpoints
# ──────────────────────────────────────────────

@app.get("/")
def home():
    return {"message": "Voice AI Agent is running"}


@app.get("/health")
def health():
    return {
        "status": "running",
        "agnes_key_loaded": bool(AGNES_API_KEY and not AGNES_API_KEY.startswith("your_")),
    }


class TTSRequest(BaseModel):
    text: str

import httpx
from fastapi.responses import Response

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "248kYlOrs8t5tLEOWi9n")

@app.post("/tts")
async def text_to_speech(req: TTSRequest):
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
    
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": req.text,
        "model_id": "eleven_flash_v2_5",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        }
    }
    max_retries = 3
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient() as client_http:
                resp = await client_http.post(url, json=data, headers=headers, timeout=30.0)
                
            if resp.status_code == 200:
                return Response(content=resp.content, media_type="audio/mpeg")
            elif resp.status_code == 429:
                logger.warning(f"ElevenLabs rate limit hit. Retrying attempt {attempt+1}/{max_retries}...")
                await asyncio.sleep(2)
            elif resp.status_code >= 500:
                logger.warning(f"ElevenLabs server error. Retrying attempt {attempt+1}/{max_retries}...")
                await asyncio.sleep(1)
            else:
                logger.error(f"ElevenLabs error: {resp.text}")
                raise HTTPException(status_code=resp.status_code, detail="TTS generation failed")
                
        except httpx.RequestError as exc:
            logger.error(f"ElevenLabs connection error: {exc}")
            if attempt == max_retries - 1:
                raise HTTPException(status_code=500, detail="TTS network error")
            await asyncio.sleep(1)

    raise HTTPException(status_code=500, detail="TTS generation failed after retries")


@app.post("/chat")
def chat(request: ChatRequest):
    """Text-based chat endpoint with role-aware system prompt."""
    system_prompt = get_prompt_for_role(request.role)

    try:
        response = client.chat.completions.create(
            model=AGNES_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message},
            ],
        )
        return {"response": response.choices[0].message.content}

    except APITimeoutError:
        raise HTTPException(
            status_code=504,
            detail="Agnes took too long to respond. Please try a shorter question.",
        )
    except Exception as e:
        logger.error("Agnes error: %s", repr(e))
        raise HTTPException(
            status_code=502,
            detail=f"Agnes request failed: {str(e)}",
        )


# ──────────────────────────────────────────────
# WebSocket Voice Endpoint
# ──────────────────────────────────────────────

@app.websocket("/ws/voice")
async def voice_ws(
    websocket: WebSocket,
    role: str = Query(default="student"),
    userId: str = Query(default="anon"),
):
    """Role-aware voice assistant WebSocket.

    Protocol:
      Client → Server:
        { "type": "session_init", "role": "student"|"educator", "context": {...} }
        { "type": "user_message", "text": "..." }
        { "type": "reset" }

      Server → Client:
        { "type": "status_update", "status": "listening"|"processing"|"speaking"|"idle" }
        { "type": "transcript", "text": "...", "sender": "user"|"assistant" }
        { "type": "session_ready", "role": "...", "persona": "..." }
        { "type": "error", "message": "..." }
    """
    await websocket.accept()
    session = VoiceSession(role=role, user_id=userId)

    persona = "Agnes"
    logger.info("Voice session started: role=%s userId=%s persona=%s", role, userId, persona)

    # Send session ready
    await websocket.send_json({
        "type": "session_ready",
        "role": role,
        "persona": persona,
        "greeting": (
            "Hi! I'm Agnes, your learning companion. What would you like to learn?"
            if role == "student"
            else "Hello! I'm Agnes, your teaching assistant. How can I help with your class today?"
        ),
    })

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            msg_type = data.get("type", "")

            if msg_type == "session_init":
                # Re-initialize session with updated role if needed
                new_role = data.get("role", role)
                if new_role != session.role:
                    session = VoiceSession(role=new_role, user_id=userId)
                    persona = "Agnes"
                logger.info("Session initialized: role=%s context=%s", new_role, data.get("context"))
                await websocket.send_json({
                    "type": "session_ready",
                    "role": new_role,
                    "persona": persona,
                })

            elif msg_type == "user_message":
                user_text = data.get("text", "").strip()
                if not user_text:
                    continue

                # Echo user transcript
                await websocket.send_json({
                    "type": "transcript",
                    "text": user_text,
                    "sender": "user",
                })

                # Update status
                await websocket.send_json({
                    "type": "status_update",
                    "status": "processing",
                })

                session.add_user_message(user_text)

                # Stream response from Agnes
                try:
                    stream = client.chat.completions.create(
                        model=AGNES_MODEL,
                        messages=session.history,
                        stream=True,
                        max_tokens=300,
                        temperature=0.7,
                    )

                    full_response = ""
                    for chunk in stream:
                        if chunk.choices and chunk.choices[0].delta.content:
                            token = chunk.choices[0].delta.content
                            full_response += token
                            # Stream tokens to client
                            await websocket.send_json({
                                "type": "token",
                                "text": token,
                            })

                    if full_response:
                        session.add_assistant_message(full_response)
                        await websocket.send_json({
                            "type": "transcript",
                            "text": full_response,
                            "sender": "assistant",
                        })
                    else:
                        fallback = "I didn't generate a response. Could you rephrase?"
                        session.add_assistant_message(fallback)
                        await websocket.send_json({
                            "type": "transcript",
                            "text": fallback,
                            "sender": "assistant",
                        })

                except Exception as e:
                    logger.error("Streaming error: %s", e)
                    await websocket.send_json({
                        "type": "error",
                        "message": "I'm having trouble connecting right now. Please try again.",
                    })

                await websocket.send_json({
                    "type": "status_update",
                    "status": "idle",
                })

            elif msg_type == "reset":
                session.reset()
                await websocket.send_json({
                    "type": "status_update",
                    "status": "idle",
                })

    except WebSocketDisconnect:
        logger.info("Voice session disconnected: userId=%s", userId)
    except Exception as e:
        logger.error("WebSocket error: %s", e)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
