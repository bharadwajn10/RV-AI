import httpx
from typing import Dict, Any, List, Optional
from app.core.settings import get_settings
from app.personalization.llm.limiter import get_limiter
import json

settings = get_settings()

class LLMRouter:
    def __init__(self):
        pass

    async def call_agnes(self, messages: List[Dict[str, str]], priority="background", stream=False, json_mode=False) -> Any:
        limiter = get_limiter()
        await limiter.acquire(priority)
        
        url = f"{settings.AGNES_BASE_URL}/chat/completions"
        headers = {"Authorization": f"Bearer {settings.AGNES_API_KEY}"}
        
        req = {
            "model": settings.AGNES_TEXT_MODEL,
            "messages": messages,
            "stream": stream
        }
        if json_mode:
            req["response_format"] = {"type": "json_object"}
            
        async with httpx.AsyncClient() as client:
            if stream:
                # Returns an async generator
                async def streamer():
                    async with client.stream("POST", url, json=req, headers=headers) as r:
                        if r.status_code != 200:
                            yield f"Error: {r.status_code}"
                            return
                        async for chunk in r.aiter_text():
                            yield chunk
                return streamer()
            else:
                r = await client.post(url, json=req, headers=headers)
                if r.status_code != 200:
                    raise Exception(f"Agnes API error: {r.status_code} {r.text}")
                if json_mode:
                    return r.json()
                return r.json()["choices"][0]["message"]["content"]
                
    async def call_local(self, messages: List[Dict[str, str]], stream=False) -> Any:
        url = f"{settings.LOCAL_URL}/chat/completions"
        req = {
            "model": settings.LOCAL_MODEL,
            "messages": messages,
            "stream": stream
        }
        async with httpx.AsyncClient() as client:
            if stream:
                async def streamer():
                    async with client.stream("POST", url, json=req) as r:
                        if r.status_code != 200:
                            yield f"Error: {r.status_code}"
                            return
                        async for chunk in r.aiter_text():
                            yield chunk
                return streamer()
            else:
                r = await client.post(url, json=req)
                if r.status_code != 200:
                    raise Exception(f"Local LLM error: {r.status_code}")
                return r.json()["choices"][0]["message"]["content"]

    async def route(self, task: str, messages: List[Dict[str, str]], priority="background", stream=False) -> Any:
        # Router policy
        agnes_tasks = ["verify_claim", "compare_sources", "suggest_paths", "parse_intent", "generate_slides", "generate_quiz", "generate_assignment", "generate_assessment", "grade_conceptual", "grade_voice_explanation", "educator_assistant"]
        local_tasks = ["chat", "practice_feedback", "small_rewrite", "insight_polish", "explain_math", "explain_code"]
        
        if task in agnes_tasks:
            return await self.call_agnes(messages, priority, stream, json_mode=not stream)
        else:
            try:
                return await self.call_local(messages, stream)
            except Exception:
                # Fallback to agnes if local is down
                return await self.call_agnes(messages, priority, stream)
