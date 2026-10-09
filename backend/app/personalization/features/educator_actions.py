from app.personalization.registry import feature
from app.core.context import AppContext
import uuid
import datetime

@feature("get_next_actions", roles=("educator",))
async def get_next_actions(ctx: AppContext, payload: dict):
    class_id = payload.get("class_id")
    # Return mock next actions for demo
    return [
        {
            "id": "action-1",
            "kind": "review_submission",
            "priority": 1,
            "title": "Review Alex's assignment",
            "detail": "Submitted 2 days ago, not graded.",
            "learner_id": "alex_learner",
            "topic_id": "trees",
            "cta": { "label": "Open submission", "route": "/assignments/1" },
            "status": "open"
        },
        {
            "id": "action-2",
            "kind": "check_in",
            "priority": 2,
            "title": "Check in with Sarah",
            "detail": "Mastery dropped more than 10 points in a week.",
            "learner_id": "sarah_learner",
            "topic_id": "graphs",
            "cta": { "label": "Send a check-in message", "route": "/students/sarah_learner" },
            "status": "open"
        }
    ]

@feature("update_next_action", roles=("educator",))
async def update_next_action(ctx: AppContext, payload: dict):
    # Mock update
    return {"status": "success"}

@feature("get_interventions", roles=("educator",))
async def get_interventions(ctx: AppContext, payload: dict):
    # Mock interventions
    return [
        {
            "id": "int-1",
            "learner_id": "alex_learner",
            "class_id": payload.get("class_id"),
            "type": "extra_material",
            "topic_ids": ["trees"],
            "note": "Assigned extra reading",
            "status": "measured",
            "created_at": "2026-09-20T10:00:00Z",
            "measured_at": "2026-10-04T10:00:00Z"
        }
    ]

@feature("get_intervention_impact", roles=("educator",))
async def get_intervention_impact(ctx: AppContext, payload: dict):
    # Mock impact
    return {
        "class_summary": {
            "share_improved": 0.8,
            "avg_mastery_change": 8,
            "best_types": ["extra_material", "message"]
        },
        "interventions": [
            {
                "id": "int-1",
                "label": "improved",
                "baseline": {"mastery": 45},
                "followup": {"mastery": 60},
                "delta": 15
            }
        ]
    }

@feature("create_intervention", roles=("educator",))
async def create_intervention(ctx: AppContext, payload: dict):
    return {"status": "success", "id": str(uuid.uuid4())}
