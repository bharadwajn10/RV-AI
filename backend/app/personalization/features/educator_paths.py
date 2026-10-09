from app.personalization.registry import feature
from app.core.context import AppContext
from app.course_db.models import Plan, PlanItem
from app.user_db.models import PersonalTask
from sqlalchemy import text
import uuid
import datetime

@feature("publish_plan", roles=("educator",))
async def publish_plan(ctx: AppContext, payload: dict):
    class_id = payload.get("class_id")
    items = payload.get("items", [])
    
    # 1. Archive old active plan
    old_plans = ctx.course_db.query(Plan).filter(Plan.class_id == class_id, Plan.status == "published").all()
    for p in old_plans:
        p.status = "archived"
        
    # 2. Create new plan
    new_plan = Plan(
        id=str(uuid.uuid4()),
        class_id=class_id,
        version=1,
        status="published",
        published_at=datetime.datetime.utcnow()
    )
    ctx.course_db.add(new_plan)
    ctx.course_db.flush()
    
    # 3. Add items and cascade to personal tasks (simplified)
    # Get all enrolled learners for this class to dispatch tasks
    # (assuming single mock user for hackathon)
    learners = ["alex_learner"] 
    
    for idx, item in enumerate(items):
        pi = PlanItem(
            id=str(uuid.uuid4()),
            plan_id=new_plan.id,
            kind=item.get("kind"),
            title=item.get("title"),
            topic_ids=item.get("topic_ids", []),
            due_at=datetime.datetime.strptime(item.get("due_at"), "%Y-%m-%dT%H:%M:%SZ") if item.get("due_at") else None,
            weight_percent=item.get("weight_percent", 0),
            order_index=idx
        )
        ctx.course_db.add(pi)
        
        # Dispatch task to learners
        for learner_id in learners:
            task = PersonalTask(
                id=str(uuid.uuid4()),
                learner_id=learner_id,
                title=pi.title,
                subject_id="data-structures",  # Hardcoded for demo
                due_at=pi.due_at,
                type=pi.kind,
                status="todo"
            )
            ctx.user_db.add(task)
            
    ctx.course_db.commit()
    ctx.user_db.commit()
    return {"status": "published", "plan_id": new_plan.id}
