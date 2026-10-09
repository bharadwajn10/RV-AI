import httpx
from typing import Dict, Any, List, Optional
from app.core.settings import get_settings
from app.personalization.llm.limiter import get_limiter
import json

settings = get_settings()

async def _stream_openai_text(url: str, req: dict, headers: Optional[dict] = None):
    """Stream an OpenAI-compatible chat completion and yield plain text deltas.
    Creates AsyncClient inside the generator so it remains open during streaming.
    """
    async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=5.0)) as client:
        async with client.stream("POST", url, json=req, headers=headers or {}) as r:
            if r.status_code != 200:
                body = (await r.aread()).decode(errors="ignore")[:300]
                raise RuntimeError(f"LLM HTTP {r.status_code}: {body}")
            async for line in r.aiter_lines():
                line = line.strip()
                if not line or not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if data == "[DONE]":
                    return
                try:
                    obj = json.loads(data)
                    choice = (obj.get("choices") or [{}])[0]
                    delta = choice.get("delta") or choice.get("message") or {}
                    text = delta.get("content")
                except Exception:
                    continue
                if text:
                    yield text


class LLMRouter:
    def __init__(self):
        pass

    def _agnes_req(self, messages, stream, json_mode=False):
        url = f"{settings.AGNES_BASE_URL}/chat/completions"
        headers = {"Authorization": f"Bearer {settings.AGNES_API_KEY}"}
        req = {
            "model": settings.AGNES_TEXT_MODEL,
            "messages": messages,
            "stream": stream
        }
        if json_mode:
            req["response_format"] = {"type": "json_object"}
        return url, req, headers

    def _local_req(self, messages, stream):
        url = f"{settings.LOCAL_URL}/chat/completions"
        req = {
            "model": settings.LOCAL_MODEL,
            "messages": messages,
            "stream": stream
        }
        return url, req, {}

    async def call_agnes(self, messages: List[Dict[str, str]], priority="background", stream=False, json_mode=False) -> Any:
        limiter = get_limiter()
        await limiter.acquire(priority)
        url, req, headers = self._agnes_req(messages, stream, json_mode)

        if stream:
            return _stream_openai_text(url, req, headers)

        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(url, json=req, headers=headers)
            if r.status_code != 200:
                raise Exception(f"Agnes API error: {r.status_code} {r.text}")
            if json_mode:
                return r.json()
            return r.json()["choices"][0]["message"]["content"]
                
    async def call_local(self, messages: List[Dict[str, str]], stream=False) -> Any:
        url, req, headers = self._local_req(messages, stream)

        if stream:
            return _stream_openai_text(url, req, headers)

        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(url, json=req)
            if r.status_code != 200:
                raise Exception(f"Local LLM error: {r.status_code}")
            return r.json()["choices"][0]["message"]["content"]

    def _stream_with_fallback(self, messages, priority):
        """Try local model if available, fall back to Agnes, then friendly message."""
        async def gen():
            sent_any = False
            # Check local first only if someone has configured a local model
            if settings.LOCAL_URL and "8081" not in settings.LOCAL_URL:
                try:
                    async for t in _stream_openai_text(*self._local_req(messages, True)):
                        sent_any = True
                        yield t
                    return
                except Exception as e:
                    print(f"[llm] local stream failed: {e!r}")
            
            # Use Agnes AI
            try:
                await get_limiter().acquire(priority)
                async for t in _stream_openai_text(*self._agnes_req(messages, True)):
                    sent_any = True
                    yield t
                return
            except Exception as e:
                print(f"[llm] agnes stream failed: {e!r}")
                if not sent_any:
                    yield "I am ready to help! What concept would you like to explore?"
        return gen()

    async def route(self, task: str, messages: List[Dict[str, str]], priority="background", stream=False) -> Any:
        agnes_tasks = [
            "voice_explain", "verify_claim", "compare_sources", "suggest_paths", 
            "parse_intent", "generate_slides", "generate_quiz", "generate_assignment", 
            "generate_assessment", "grade_conceptual", "grade_voice_explanation", "educator_assistant"
        ]
        
        if stream:
            # If task is an agnes task or local is not up, stream with Agnes fallback
            return self._stream_with_fallback(messages, priority)
            
        if task in agnes_tasks:
            return await self.call_agnes(messages, priority, stream, json_mode=not stream)
        else:
            try:
                return await self.call_local(messages, stream)
            except Exception:
                return await self.call_agnes(messages, priority, stream)
