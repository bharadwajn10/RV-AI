from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

# Common User
class User(BaseModel):
    name: str

# Dashboard
class LearnerStats(BaseModel):
    progress: int
    streak: int

class DashboardSubject(BaseModel):
    id: str
    name: str
    progress: int
    icon: str
    category: str

class DueTask(BaseModel):
    id: str
    type: str # "Assignment|Test|Assessment|Reading|Quiz|Project|Personal"
    title: str
    subject_id: Optional[str] = None
    subject_name: Optional[str] = None
    due_at: str # ISO
    status: str # "todo|doing|done|overdue"

class QuickAction(BaseModel):
    id: str # "understand|voice|flashcards|rapid_fire"
    title: str
    subtitle: str
    route: str

class LearningMode(BaseModel):
    id: str # "understand|exam"
    title: str
    subtitle: str
    route: str

class LearnerDashboard(BaseModel):
    user: User
    stats: LearnerStats
    subjects: List[DashboardSubject]
    due_tasks: List[DueTask]
    quick_actions: List[QuickAction]
    learning_modes: List[LearningMode]

# Subjects
class Topic(BaseModel):
    id: str
    name: str
    status: str # "completed|in_progress|not_started"
    difficulty: str # "Easy|Medium|Hard"
    est_minutes: int
    progress_pct: int

class SubjectDetail(BaseModel):
    id: str
    name: str
    category: str
    icon: str
    description: str
    enrolled: bool
    progress: int
    topicsCompleted: int
    totalTopics: int
    lastStudiedTopic: str
    estimatedRemainingMinutes: int
    continue_topic_id: str
    topics: List[Topic]

# Learn
class Block(BaseModel):
    type: str # markdown, slides, video, quiz, flashcards
    body: Optional[str] = None
    source_chunk_ids: Optional[List[str]] = None
    external: Optional[bool] = None
    deck_id: Optional[str] = None
    slides: Optional[List[Dict[str, Any]]] = None
    url: Optional[str] = None
    title: Optional[str] = None
    quiz_id: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = None

class AdaptedFor(BaseModel):
    reading_level: str
    depth: str
    language: str

class Lesson(BaseModel):
    id: str
    subject_id: str
    title: str
    status: str
    est_minutes: int
    adapted_for: AdaptedFor
    blocks: List[Block]

# Tasks
class TaskDetail(DueTask):
    weight_percent: Optional[int] = None
    score: Optional[int] = None
    plan_item_id: Optional[str] = None

class CreatePersonalTask(BaseModel):
    title: str
    subject_id: Optional[str] = None
    due_at: str
    type: Optional[str] = None

# Voice
class VoiceOptions(BaseModel):
    goals: List[str]
    difficulties: List[str]
    styles: List[str]
    languages: List[str]
    modes: List[str]

class VoiceTurnReq(BaseModel):
    text: str
    subject_id: str
    topic_id: str
    goal: str
    mode: str
    difficulty: Optional[str] = None
    style: Optional[str] = None
    language: Optional[str] = None
    session_id: Optional[str] = None

# Flashcards
class Flashcard(BaseModel):
    id: str
    topic_id: str
    topic_name: str
    front: str
    back: str

class FlashcardSession(BaseModel):
    session_id: str
    cards: List[Flashcard]
    total: int
    remaining: int

class FlashcardReview(BaseModel):
    card_id: str
    known: bool
    session_id: str

# Exam
class PracticeTestInfo(BaseModel):
    questions: int
    minutes: int
    difficulty: str

class Readiness(BaseModel):
    percent: int
    basis: str

class TopicAccuracy(BaseModel):
    topic_id: str
    topic: str
    name: str
    accuracy: int
    needs_review: bool

class RevisionItem(BaseModel):
    id: str
    title: str
    subtitle: str
    available: bool

class RecommendationAction(BaseModel):
    title: str
    reason: str
    topic_id: str
    actions: List[str]

class ExamOverview(BaseModel):
    practice_test: PracticeTestInfo
    readiness: Readiness
    topic_accuracy: List[TopicAccuracy]
    last_minute_revision: List[RevisionItem]
    recommendation: RecommendationAction

class GenerateExamReq(BaseModel):
    subject_id: str
    topic_ids: Optional[List[str]] = None
    questions: int = 30
    minutes: int = 45
    difficulty: str = "mixed"
    mode: str = "exam"
    seconds: Optional[int] = None

# Progress
class OverallUnderstanding(BaseModel):
    percent: int
    mastered_share: float

class SkillArea(BaseModel):
    id: str
    label: str
    percent: int

class ProgressStats(BaseModel):
    questions_answered: int
    concepts_completed: int
    study_minutes: int
    streak_days: int

class TopicMastery(BaseModel):
    id: str
    name: str
    percent: int
    focus: bool

class TopicMasteryList(BaseModel):
    subject_id: str
    topics: List[TopicMastery]

class InsightRecommendation(BaseModel):
    label: str
    route: str

class Insight(BaseModel):
    headline: str
    detail: str
    recommended: InsightRecommendation

class LearnerProgress(BaseModel):
    overall_understanding: OverallUnderstanding
    skill_areas: List[SkillArea]
    stats: ProgressStats
    topic_mastery: TopicMasteryList
    insight: Insight
