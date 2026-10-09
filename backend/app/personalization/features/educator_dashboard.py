from app.personalization.registry import feature
from app.core.context import AppContext
from app.schemas.educator import EducatorDashboard, EducatorKPIs, InterventionImpactSummary

@feature("get_class_dashboard", roles=("educator",))
async def get_class_dashboard(ctx: AppContext, payload: dict):
    # Dummy mock data for frontend
    class_id = payload.get("class_id")
    return EducatorDashboard(
        kpis=EducatorKPIs(avg_mastery=63, active_learners_7d=21, at_risk=4, completion_rate=58, avg_score=71),
        alerts=[],
        next_best_actions=[],
        intervention_impact=InterventionImpactSummary(tracked=6, improved_share=0.5, avg_mastery_change=6.2),
        paths=[]
    ).model_dump()
