from app.personalization.registry import feature
from app.core.context import AppContext
from app.schemas.learner import LearnerDashboard, User, LearnerStats, DueTask
from app.user_db.models import PersonalTask

@feature("get_dashboard", roles=("learner",))
async def get_dashboard(ctx: AppContext):
    # Query tasks
    tasks = ctx.user_db.query(PersonalTask).filter(PersonalTask.learner_id == ctx.user.id).all()
    due_tasks = []
    for t in tasks:
        due_tasks.append(DueTask(
            id=t.id,
            type=t.type,
            title=t.title,
            subject_id=t.subject_id,
            subject_name="Data Structures", # Mock
            due_at=t.due_at.isoformat() + "Z" if t.due_at else "",
            status=t.status
        ))
        
    return LearnerDashboard(
        user=User(name=ctx.user.display_name or "Alex"),
        stats=LearnerStats(progress=72, streak=6),
        subjects=[],
        due_tasks=due_tasks,
        quick_actions=[],
        learning_modes=[]
    ).model_dump()

@feature("get_notifications", roles=("learner",))
async def get_notifications(ctx: AppContext):
    # Mocking notifications for demo
    return {
        "notifications": [
            {
                "id": "notif-1",
                "kind": "check_in",
                "body": "Hi Alex, I noticed you've been inactive for a few days. Let me know if you need help with Trees!",
                "created_at": "2026-10-09T10:00:00Z"
            }
        ]
    }
