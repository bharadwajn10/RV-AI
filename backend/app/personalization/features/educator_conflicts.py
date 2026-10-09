from app.personalization.registry import feature
from app.core.context import AppContext
from app.course_db.models import Conflict
from sqlalchemy import select

@feature("list_conflicts", roles=("educator",))
async def list_conflicts(ctx: AppContext, payload: dict):
    class_id = payload.get("class_id")
    conflicts = ctx.course_db.query(Conflict).filter(Conflict.class_id == class_id).all()
    
    return {
        "conflicts": [
            {
                "id": c.id,
                "topic_id": c.topic_id,
                "claim_a": c.claim_a,
                "claim_b": c.claim_b,
                "winner": c.winner,
                "reason": c.reason,
                "overridden_by_educator": c.overridden_by_educator
            } for c in conflicts
        ]
    }

@feature("override_conflict", roles=("educator",))
async def override_conflict(ctx: AppContext, payload: dict):
    conflict_id = payload.get("conflict_id")
    conflict = ctx.course_db.query(Conflict).filter(Conflict.id == conflict_id).first()
    
    if conflict:
        # Flip winner
        conflict.winner = "claim_b" if conflict.winner == "claim_a" else "claim_a"
        conflict.overridden_by_educator = True
        ctx.course_db.commit()
        return {"status": "success", "new_winner": conflict.winner}
    return {"status": "not_found"}
