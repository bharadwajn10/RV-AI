from app.personalization.registry import feature
from app.core.context import AppContext

@feature("get_knowledge_graph", roles=("educator",))
async def get_knowledge_graph(ctx: AppContext, payload: dict):
    # Mocking knowledge graph for demo
    return {
        "nodes": [
            {
                "id": "arrays",
                "name": "Arrays",
                "subject_id": "data-structures",
                "class_mastery": 75,
                "learner_mastery": 80 if payload.get("learner_id") else None,
                "state": "strong",
                "predicted_gap": False
            },
            {
                "id": "trees",
                "name": "Trees",
                "subject_id": "data-structures",
                "class_mastery": 41,
                "learner_mastery": 30 if payload.get("learner_id") else None,
                "state": "gap",
                "predicted_gap": True
            }
        ],
        "edges": [
            {
                "from": "arrays",
                "to": "trees",
                "type": "prerequisite"
            }
        ]
    }
