from fastapi import APIRouter, Depends
from app.core.dependencies import get_context
from app.core.context import AppContext
from app.core.envelope import success

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard(ctx: AppContext = Depends(get_context)):
    from app.personalization.registry import call
    return success(await call("get_dashboard", ctx))

from fastapi.responses import StreamingResponse
from pydantic import BaseModel

class VoiceTurnReq(BaseModel):
    topic_id: str
    text: str
    
@router.post("/voice/turn")
async def voice_turn(req: VoiceTurnReq, ctx: AppContext = Depends(get_context)):
    from app.personalization.registry import call
    generator_func = await call("voice_turn", ctx, req.model_dump())
    return StreamingResponse(generator_func(), media_type="text/plain")

class SubmitReq(BaseModel):
    topic_id: str
    question: str
    answer: str

@router.post("/submit")
async def submit_answer(req: SubmitReq, ctx: AppContext = Depends(get_context)):
    from app.personalization.registry import call
    result = await call("submit_answer", ctx, req.model_dump())
    return success(result)

@router.get("/notifications")
async def get_notifications(ctx: AppContext = Depends(get_context)):
    from app.personalization.registry import call
    result = await call("get_notifications", ctx)
    return success(result)
