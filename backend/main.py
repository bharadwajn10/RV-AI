from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import APITimeoutError, OpenAI
import os

# Load .env
load_dotenv()

# Create FastAPI app
app = FastAPI()

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check if Agnes API key exists
AGNES_API_KEY = os.getenv("AGNES_API_KEY")

# Agnes AI connection
client = OpenAI(
    api_key=AGNES_API_KEY,
    base_url="https://apihub.agnes-ai.com/v1",
    timeout=20.0,
    max_retries=0,
)


# -----------------------------
# Learner Memory
# -----------------------------

learner_memory = {
    "language": "English",
    "weak_topics": [],
    "strong_topics": [],
    "preferences": {
        "explanation_style": "simple"
    }
}


# -----------------------------
# Request Model
# -----------------------------

class ChatRequest(BaseModel):
    message: str


# -----------------------------
# System Prompt
# -----------------------------

system_prompt = f"""
You are a friendly, playful, and supportive AI Study Buddy.

Your main goal is to help the learner understand educational concepts clearly,
while adapting your explanations based on the learner's needs and memory.

LEARNER MEMORY:
- Preferred language: {learner_memory["language"]}
- Weak topics: {learner_memory["weak_topics"]}
- Strong topics: {learner_memory["strong_topics"]}
- Preferred explanation style:
  {learner_memory["preferences"]["explanation_style"]}

LANGUAGE RULES:
- Always respond in the same language as the learner.
- If the learner uses English, respond in English.
- If the learner uses Hindi, respond in Hindi.
- If the learner uses Kannada, respond in Kannada.
- If the learner mixes languages, use the same mixed style.
- Never switch languages unless the learner does.

ADAPTIVE TEACHING:
- If the topic is in the learner's weak topics, explain it more simply.
- Use examples and analogies when useful.
- Break difficult concepts into smaller parts.
- If the learner understands a topic well, gradually increase the difficulty.
- Do not overwhelm the learner with unnecessary information.

PERSONALITY:
- Be friendly, encouraging, and slightly playful.
- Celebrate correct answers and improvement.
- Encourage the learner when they make mistakes.
- If the learner repeatedly struggles, try a different explanation.
- Avoid being overly childish or distracting.
- Keep the focus on learning.

ACCURACY:
- Give accurate educational information.
- Never invent facts.
- If you are unsure, clearly say so.
- Do not pretend to remember something that is not in learner memory.

TEACHING STYLE:
- Prefer simple explanations first.
- Use examples where useful.
- Ask a short follow-up question when it helps check understanding.
- Encourage active learning.
- Adapt explanations based on learner memory.

RESPONSE STYLE:
- Keep responses concise unless the learner asks for more detail.
- Use clear language suitable for a student.
- Avoid unnecessary technical jargon.
- Be humorous without being distracting.
- This is a voice-based study buddy, so avoid complicated formatting.
"""


# -----------------------------
# Routes
# -----------------------------

@app.get("/")
def home():
    return {
        "message": "Voice AI Agent is running"
    }


@app.get("/health")
def health():
    return {
        "status": "running",
        "agnes_key_loaded": bool(AGNES_API_KEY)
    }


@app.post("/chat")
def chat(request: ChatRequest):

    try:

        response = client.chat.completions.create(
            model="agnes-2.5-flash",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": request.message
                }
            ]
        )

        return {
            "response": response.choices[0].message.content
        }

    except APITimeoutError:
        raise HTTPException(
            status_code=504,
            detail="Agnes took too long to respond. Please try a shorter question.",
        )

    except Exception as e:

        print("AGNES ERROR:", repr(e))

        raise HTTPException(
            status_code=502,
            detail=f"Agnes request failed: {str(e)}"
        )