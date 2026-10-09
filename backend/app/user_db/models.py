from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, DateTime, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

def get_now():
    return datetime.datetime.utcnow()

class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String) # "educator"|"learner"
    status = Column(String)
    full_name = Column(String)
    display_name = Column(String)
    avatar_url = Column(String)
    country = Column(String)
    timezone = Column(String)
    last_login_at = Column(DateTime)
    ui_language = Column(String)
    content_language = Column(String)
    secondary_languages = Column(JSON)
    accessibility = Column(JSON)
    voice_settings = Column(JSON)
    connectivity = Column(JSON)
    notifications = Column(JSON)
    consent = Column(JSON)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class LearnerProfile(Base):
    __tablename__ = 'learner_profiles'
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, index=True)
    institution = Column(String)
    program = Column(String)
    specialization = Column(String)
    year = Column(String)
    semester = Column(String)
    student_code = Column(String)
    reading_level = Column(String)
    explanation_depth = Column(String)
    pace = Column(String)
    preferred_formats = Column(JSON)
    modalities = Column(JSON)
    study_minutes_per_day = Column(Integer)
    goals_text = Column(String)
    career_interests = Column(JSON)
    target_grade = Column(String)
    prior_knowledge = Column(JSON)
    self_confidence = Column(JSON)
    accommodations = Column(JSON)
    streak_days = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_active_at = Column(DateTime)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class LearnerSubjectSetting(Base):
    __tablename__ = 'learner_subject_settings'
    id = Column(String, primary_key=True, default=generate_uuid)
    learner_id = Column(String, index=True)
    subject_id = Column(String, index=True)
    class_id = Column(String)
    intent = Column(String)
    weekly_hours = Column(Integer)
    target_score = Column(Integer)
    preferred_formats = Column(JSON)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class EducatorProfile(Base):
    __tablename__ = 'educator_profiles'
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, index=True)
    institution = Column(String)
    department = Column(String)
    designation = Column(String)
    years_experience = Column(Integer)
    bio = Column(String)
    subjects_taught = Column(JSON)
    teaching_style = Column(JSON)
    default_plan = Column(JSON)
    default_question_mix = Column(JSON)
    default_difficulty = Column(Integer)
    grading_strictness = Column(Integer)
    delivery_notes_default = Column(String)
    alert_rules = Column(JSON)
    intake_language = Column(String)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class ClassModel(Base):
    __tablename__ = 'classes'
    id = Column(String, primary_key=True, default=generate_uuid)
    educator_id = Column(String, index=True)
    subject_id = Column(String)
    name = Column(String)
    term = Column(String)
    section = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class Enrollment(Base):
    __tablename__ = 'enrollments'
    id = Column(String, primary_key=True, default=generate_uuid)
    class_id = Column(String, index=True)
    learner_id = Column(String, index=True)
    subject_id = Column(String)
    status = Column(String)
    joined_at = Column(DateTime)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class Mastery(Base):
    __tablename__ = 'mastery'
    id = Column(String, primary_key=True, default=generate_uuid)
    learner_id = Column(String, index=True)
    topic_id = Column(String, index=True)
    score = Column(Float)
    confidence = Column(Float)
    attempts = Column(Integer)
    last_practiced_at = Column(DateTime)
    history = Column(JSON)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class Attempt(Base):
    __tablename__ = 'attempts'
    id = Column(String, primary_key=True, default=generate_uuid)
    learner_id = Column(String, index=True)
    class_id = Column(String)
    assignment_id = Column(String)
    item_id = Column(String)
    topic_id = Column(String, index=True)
    kind = Column(String)
    mode = Column(String)
    correct = Column(Float)
    time_taken_s = Column(Integer)
    transcript = Column(String)
    rubric_scores = Column(JSON)
    feedback = Column(String)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class Progress(Base):
    __tablename__ = 'progress'
    id = Column(String, primary_key=True, default=generate_uuid)
    learner_id = Column(String, index=True)
    topic_id = Column(String)
    subject_id = Column(String)
    status = Column(String)
    blocks_viewed = Column(JSON)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class PersonalTask(Base):
    __tablename__ = 'personal_tasks'
    id = Column(String, primary_key=True, default=generate_uuid)
    learner_id = Column(String, index=True)
    title = Column(String)
    subject_id = Column(String)
    due_at = Column(DateTime)
    type = Column(String)
    status = Column(String)
    notes = Column(String)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class Submission(Base):
    __tablename__ = 'submissions'
    id = Column(String, primary_key=True, default=generate_uuid)
    assignment_id = Column(String, index=True)
    learner_id = Column(String, index=True)
    status = Column(String)
    score = Column(Float)
    answer = Column(JSON)
    transcript = Column(String)
    feedback = Column(String)
    submitted_at = Column(DateTime)
    graded_at = Column(DateTime)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class FlashcardState(Base):
    __tablename__ = 'flashcard_state'
    id = Column(String, primary_key=True, default=generate_uuid)
    learner_id = Column(String, index=True)
    card_id = Column(String, index=True)
    ease = Column(Float)
    interval_days = Column(Integer)
    reps = Column(Integer)
    lapses = Column(Integer)
    due_at = Column(DateTime)
    last_reviewed_at = Column(DateTime)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class FlashcardSession(Base):
    __tablename__ = 'flashcard_sessions'
    id = Column(String, primary_key=True, default=generate_uuid)
    learner_id = Column(String, index=True)
    subject_id = Column(String)
    topic_id = Column(String)
    card_ids = Column(JSON)
    reviewed = Column(JSON)
    started_at = Column(DateTime)
    finished_at = Column(DateTime)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class PracticeExam(Base):
    __tablename__ = 'practice_exams'
    id = Column(String, primary_key=True, default=generate_uuid)
    learner_id = Column(String, index=True)
    subject_id = Column(String)
    mode = Column(String)
    spec = Column(JSON)
    item_ids = Column(JSON)
    started_at = Column(DateTime)
    minutes = Column(Integer)
    status = Column(String)
    score = Column(Float)
    submitted_at = Column(DateTime)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class VoiceSession(Base):
    __tablename__ = 'voice_sessions'
    id = Column(String, primary_key=True, default=generate_uuid)
    learner_id = Column(String, index=True)
    subject_id = Column(String)
    topic_ids = Column(JSON)
    config = Column(JSON)
    turns = Column(JSON)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class PredictedGap(Base):
    __tablename__ = 'predicted_gaps'
    id = Column(String, primary_key=True, default=generate_uuid)
    learner_id = Column(String, index=True)
    topic_id = Column(String)
    readiness = Column(Float)
    reason = Column(String)
    resolved = Column(Boolean)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class NextAction(Base):
    __tablename__ = 'next_actions'
    id = Column(String, primary_key=True, default=generate_uuid)
    educator_id = Column(String, index=True)
    class_id = Column(String, index=True)
    learner_id = Column(String)
    topic_id = Column(String)
    kind = Column(String)
    title = Column(String)
    detail = Column(String)
    priority = Column(Integer)
    impact = Column(String)
    status = Column(String)
    cta = Column(JSON)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class Intervention(Base):
    __tablename__ = 'interventions'
    id = Column(String, primary_key=True, default=generate_uuid)
    educator_id = Column(String, index=True)
    learner_id = Column(String, index=True)
    class_id = Column(String)
    type = Column(String)
    topic_ids = Column(JSON)
    note = Column(String)
    baseline = Column(JSON)
    followup = Column(JSON)
    window_days = Column(Integer)
    status = Column(String)
    measured_at = Column(DateTime)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class Message(Base):
    __tablename__ = 'messages'
    id = Column(String, primary_key=True, default=generate_uuid)
    from_id = Column(String, index=True)
    to_id = Column(String, index=True)
    class_id = Column(String)
    kind = Column(String)
    body = Column(String)
    read_at = Column(DateTime)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class StudyEvent(Base):
    __tablename__ = 'study_events'
    id = Column(String, primary_key=True, default=generate_uuid)
    learner_id = Column(String, index=True)
    kind = Column(String)
    subject_id = Column(String)
    topic_id = Column(String)
    seconds = Column(Integer)
    at = Column(DateTime)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class AssistantSession(Base):
    __tablename__ = 'assistant_sessions'
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, index=True)
    role = Column(String)
    context = Column(JSON)
    turns = Column(JSON)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class Job(Base):
    __tablename__ = 'jobs'
    id = Column(String, primary_key=True, default=generate_uuid)
    kind = Column(String)
    status = Column(String)
    progress = Column(Float)
    result_ref = Column(String)
    error = Column(String)
    created_by = Column(String)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class Cache(Base):
    __tablename__ = 'cache'
    id = Column(String, primary_key=True, default=generate_uuid)
    key = Column(String, unique=True, index=True)
    value = Column(JSON)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

def init_db(engine):
    Base.metadata.create_all(engine)
