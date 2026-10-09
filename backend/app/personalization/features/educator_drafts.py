from app.personalization.registry import feature
from app.core.context import AppContext
from app.personalization.agents.generator import generate_draft
from app.course_db.models import Draft, QuestionBank
from fastapi import BackgroundTasks
import uuid
import datetime

@feature("request_draft", roles=("educator",))
async def request_draft(ctx: AppContext, payload: dict, background_tasks: BackgroundTasks):
    class_id = payload.get("class_id")
    kind = payload.get("kind")
    spec = payload.get("spec", {})
    
    background_tasks.add_task(generate_draft, ctx, class_id, kind, spec, ctx.user.id)
    return {"status": "generating", "kind": kind}

@feature("approve_draft", roles=("educator",))
async def approve_draft(ctx: AppContext, payload: dict):
    draft_id = payload.get("draft_id")
    draft = ctx.course_db.query(Draft).filter(Draft.id == draft_id).first()
    
    if not draft:
        raise ValueError("Draft not found")
        
    if draft.status != "ready":
        raise ValueError("Draft is not ready")
        
    draft.status = "approved"
    
    # Save payload to appropriate actual table (e.g. QuestionBank for quiz)
    if draft.kind in ["quiz", "test", "assessment"]:
        items = draft.payload.get("items", [])
        for item in items:
            qb = QuestionBank(
                id=str(uuid.uuid4()),
                class_id=draft.class_id,
                topic_ids=item.get("topic_ids", []),
                kind=draft.kind,
                type=item.get("type", "mcq"),
                prompt=item.get("prompt", ""),
                options=item.get("options", []),
                answer=item.get("answer", ""),
                explanation=item.get("explanation", ""),
                difficulty=item.get("difficulty", 50),
                source_chunk_ids=draft.source_chunk_ids,
                approved=True,
                created_at=datetime.datetime.utcnow()
            )
            ctx.course_db.add(qb)
            
    ctx.course_db.commit()
    return {"status": "approved", "draft_id": draft_id}
