from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# Dashboard
class EducatorKPIs(BaseModel):
    avg_mastery: int
    active_learners_7d: int
    at_risk: int
    completion_rate: int
    avg_score: int

class Alert(BaseModel):
    id: str
    learner_id: str
    title: str
    detail: str
    impact: str # "high|medium|low"

class CTA(BaseModel):
    label: str
    route: str

class NextBestAction(BaseModel):
    id: str
    kind: str
    priority: int
    impact: str
    title: str
    detail: str
    learner_id: Optional[str] = None
    topic_id: Optional[str] = None
    cta: CTA
    status: str # "open"

class InterventionImpactSummary(BaseModel):
    tracked: int
    improved_share: float
    avg_mastery_change: float

class PathSummary(BaseModel):
    id: str
    title: str
    progress: int
    status: str # "ai_suggested|draft|under_review|published"

class EducatorDashboard(BaseModel):
    kpis: EducatorKPIs
    alerts: List[Alert]
    next_best_actions: List[NextBestAction]
    intervention_impact: InterventionImpactSummary
    paths: List[PathSummary]

# Analytics
class MasteryDistribution(BaseModel):
    bucket: str
    count: int

class TopicHeatmapByKind(BaseModel):
    concept: int
    application: int
    industry: int
    exam: int
    recall: int

class TopicHeatmap(BaseModel):
    topic_id: str
    name: str
    by_kind: TopicHeatmapByKind
    class_mastery: int

class StrugglingConcept(BaseModel):
    topic_id: str
    name: str
    class_mastery: int
    learners_below_50_pct: int
    common_misconceptions: List[str]

class TrendData(BaseModel):
    week: str
    avg_mastery: int
    active_learners: int

class EducatorAnalytics(BaseModel):
    kpis: EducatorKPIs
    mastery_distribution: List[MasteryDistribution]
    topic_heatmap: List[TopicHeatmap]
    struggling_concepts: List[StrugglingConcept]
    trend: List[TrendData]

# Students
class StudentRow(BaseModel):
    learner_id: str
    studentName: str
    progress: int
    status: str # "on_track|at_risk|behind"
    mastery: int
    last_active_at: str
    streak_days: int
    pending_assignments: int
    gaps: List[str]

class StudentDetail(BaseModel):
    # Combines LearnerProgress with educator specific details
    overall_understanding: Dict[str, Any]
    skill_areas: List[Dict[str, Any]]
    stats: Dict[str, Any]
    topic_mastery: Dict[str, Any]
    insight: Dict[str, Any]
    interventions: List[Dict[str, Any]]
    notes: List[Dict[str, Any]]

# Knowledge Graph
class KGNode(BaseModel):
    id: str
    name: str
    subject_id: str
    class_mastery: int
    learner_mastery: Optional[int] = None
    state: str # "strong|developing|gap"
    predicted_gap: bool

class KGEdge(BaseModel):
    from_: str = BaseModel.model_fields.get("from_", Field(alias="from"))
    to: str
    type: str # "prerequisite"

class KnowledgeGraph(BaseModel):
    nodes: List[KGNode]
    edges: List[KGEdge]

# Materials
class Material(BaseModel):
    id: str
    type: str
    title: str
    subtitle: str
    caption: str
    status: str # "processing|ready|failed"
    chunks: int
    topic_ids: List[str]
    uploaded_at: str
    authority: float
    language: str

# Paths
class Module(BaseModel):
    id: str
    title: str
    topic_ids: List[str]
    order: int
    weight_percent: int
    due_at: str
    delivery_notes: str

class LearningPath(BaseModel):
    id: str
    class_id: str
    version: int
    status: str # "ai_suggested|draft|under_review|published"
    topics: List[Dict[str, Any]]
    modules: List[Module]
    order: List[str]

# Assignments
class Assignment(BaseModel):
    id: str
    title: str
    type: str
    brief: str
    due_date: str
    rubric: Dict[str, Any]
    weight_percent: int
    status: str
    assigned: int
    submitted: int
    graded: int
    avg_score: float

class AssistantChatReq(BaseModel):
    text: str
    context: Dict[str, Any]
    session_id: Optional[str] = None
