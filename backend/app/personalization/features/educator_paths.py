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

async def _suggest_paths_bg(ctx: AppContext, class_id: str, job_id: str):
    from app.user_db.models import Job
    from app.personalization.llm.router import Router
    
    # 1. Fetch materials for this class
    # (assuming some materials exist or fallback to generic prompt)
    
    # 2. Call Agnes
    prompt = f"Suggest a learning path syllabus with 4 modules for class {class_id}. Return a JSON object with a 'modules' array of strings."
    try:
        res = await Router.generate_json(
            prompt=prompt,
            schema={"type": "object", "properties": {"modules": {"type": "array", "items": {"type": "string"}}}},
            priority="background"
        )
        
        # 3. Update job
        job = ctx.user_db.query(Job).filter(Job.id == job_id).first()
        if job:
            job.status = "done"
            job.result_ref = str(res)
            ctx.user_db.commit()
    except Exception as e:
        job = ctx.user_db.query(Job).filter(Job.id == job_id).first()
        if job:
            job.status = "failed"
            job.error = str(e)
            ctx.user_db.commit()

@feature("suggest_learning_paths", roles=("educator",))
async def suggest_learning_paths(ctx: AppContext, payload: dict, background_tasks=None):
    from app.user_db.models import Job
    class_id = payload.get("class_id")
    job_id = str(uuid.uuid4())
    
    job = Job(id=job_id, kind="suggest_path", status="running", created_by="educator")
    ctx.user_db.add(job)
    ctx.user_db.commit()
    
    if background_tasks:
        background_tasks.add_task(_suggest_paths_bg, ctx, class_id, job_id)
        
    return {"job_id": job_id}

@feature("parse_educator_intent", roles=("educator",))
async def parse_educator_intent(ctx: AppContext, payload: dict):
    from app.personalization.llm.router import Router
    text = payload.get("text")
    
    prompt = f"The educator said: '{text}'. Parse this into a structured change for the curriculum (e.g. reschedule, add topic). Return a JSON object with 'action' and 'details'."
    schema = {
        "type": "object", 
        "properties": {
            "action": {"type": "string"},
            "details": {"type": "string"}
        }
    }
    
    res = await Router.generate_json(prompt, schema, priority="interactive")
    return {"proposed_change": res}
