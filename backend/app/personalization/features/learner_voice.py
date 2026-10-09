from fastapi.responses import StreamingResponse
from app.personalization.registry import feature
from app.core.context import AppContext
import json

@feature("voice_turn", roles=("learner",))
async def voice_turn(ctx: AppContext, payload: dict):
    # Retrieve
    class_id = "ds-class-1" # Hardcoded for hackathon demo single class
    topic_id = payload.get("topic_id", "")
    text = payload.get("text", "")
    
    # Simple FTS5 retrieve for context
    from app.personalization.agents.generator import retrieve_chunks
    context = await retrieve_chunks(ctx, class_id, [topic_id], count=3)
    
    system_prompt = "You are a voice AI tutor. Keep responses short and conversational."
    user_prompt = f"Context: {context}\n\nStudent says: {text}\nRespond as the tutor:"
    
    # 1. Ask Router for streaming response
    streamer = await ctx.llm_router.route(
        task="voice_explain",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        priority="interactive",
        stream=True
    )
    
    # We must return a FastAPI StreamingResponse
    async def format_stream():
        async for chunk in streamer:
            # Send SSE or raw chunks depending on frontend expectation
            # We'll send raw text for simplicity if frontend reads reader()
            yield chunk
            
    return format_stream
