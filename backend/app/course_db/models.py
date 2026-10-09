from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, DateTime, create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

def get_now():
    return datetime.datetime.utcnow()

class Subject(Base):
    __tablename__ = 'subjects'
    id = Column(String, primary_key=True) # slug
    name = Column(String)
    category = Column(String)
    icon = Column(String)
    description = Column(String)
    degree = Column(String)
    specialization = Column(String)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class Topic(Base):
    __tablename__ = 'topics'
    id = Column(String, primary_key=True) # slug
    subject_id = Column(String, index=True)
    name = Column(String)
    description = Column(String)
    prereq_ids = Column(JSON)
    difficulty = Column(String)
    est_minutes = Column(Integer)
    order_index = Column(Integer)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class Material(Base):
    __tablename__ = 'materials'
    id = Column(String, primary_key=True, default=generate_uuid)
    class_id = Column(String, index=True)
    owner_id = Column(String)
    type = Column(String)
    title = Column(String)
    subtitle = Column(String)
    caption = Column(String)
    url = Column(String)
    file_path = Column(String)
    published_at = Column(DateTime)
    uploaded_at = Column(DateTime)
    version = Column(Integer)
    authority = Column(Float)
    language = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class MaterialChunk(Base):
    __tablename__ = 'material_chunks'
    id = Column(String, primary_key=True, default=generate_uuid)
    material_id = Column(String, index=True)
    class_id = Column(String)
    topic_ids = Column(JSON)
    text = Column(String)
    locator = Column(String)
    origin = Column(String)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

# Note: FTS5 virtual table for material_chunks needs to be created via raw SQL during init

class Plan(Base):
    __tablename__ = 'plans'
    id = Column(String, primary_key=True, default=generate_uuid)
    class_id = Column(String, index=True)
    version = Column(Integer)
    status = Column(String)
    published_at = Column(DateTime)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class PlanItem(Base):
    __tablename__ = 'plan_items'
    id = Column(String, primary_key=True, default=generate_uuid)
    plan_id = Column(String, index=True)
    kind = Column(String)
    title = Column(String)
    topic_ids = Column(JSON)
    due_at = Column(DateTime)
    weight_percent = Column(Integer)
    delivery_notes = Column(String)
    order_index = Column(Integer)
    module_id = Column(String)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class Draft(Base):
    __tablename__ = 'drafts'
    id = Column(String, primary_key=True, default=generate_uuid)
    class_id = Column(String, index=True)
    kind = Column(String)
    status = Column(String)
    payload = Column(JSON)
    validation_warnings = Column(JSON)
    source_chunk_ids = Column(JSON)
    model_info = Column(JSON)
    review_notes = Column(String)
    created_by = Column(String)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class Assignment(Base):
    __tablename__ = 'assignments'
    id = Column(String, primary_key=True, default=generate_uuid)
    class_id = Column(String, index=True)
    type = Column(String)
    title = Column(String)
    brief = Column(String)
    rubric = Column(JSON)
    key_points = Column(JSON)
    topic_ids = Column(JSON)
    item_ids = Column(JSON)
    due_at = Column(DateTime)
    weight_percent = Column(Integer)
    status = Column(String)
    approved_by = Column(String)
    version = Column(Integer)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class SlideDeck(Base):
    __tablename__ = 'slide_decks'
    id = Column(String, primary_key=True, default=generate_uuid)
    class_id = Column(String, index=True)
    topic_ids = Column(JSON)
    title = Column(String)
    slides = Column(JSON)
    approved = Column(Boolean)
    version = Column(Integer)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class QuestionBank(Base):
    __tablename__ = 'question_bank'
    id = Column(String, primary_key=True, default=generate_uuid)
    class_id = Column(String, index=True)
    topic_ids = Column(JSON)
    kind = Column(String)
    type = Column(String)
    prompt = Column(String)
    options = Column(JSON)
    answer = Column(String)
    explanation = Column(String)
    difficulty = Column(Integer)
    source_chunk_ids = Column(JSON)
    approved = Column(Boolean)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class Flashcard(Base):
    __tablename__ = 'flashcards'
    id = Column(String, primary_key=True, default=generate_uuid)
    deck_id = Column(String)
    class_id = Column(String, index=True)
    topic_id = Column(String)
    front = Column(String)
    back = Column(String)
    source_chunk_ids = Column(JSON)
    source = Column(String)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class TopicContent(Base):
    __tablename__ = 'topic_content'
    id = Column(String, primary_key=True, default=generate_uuid)
    topic_id = Column(String, index=True)
    class_id = Column(String)
    language = Column(String)
    reading_level = Column(String)
    blocks = Column(JSON)
    approved = Column(Boolean)
    is_fallback = Column(Boolean)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class RevisionSection(Base):
    __tablename__ = 'revision_sections'
    id = Column(String, primary_key=True, default=generate_uuid)
    subject_id = Column(String, index=True)
    section_id = Column(String)
    content = Column(JSON)
    generated = Column(Boolean)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class Conflict(Base):
    __tablename__ = 'conflicts'
    id = Column(String, primary_key=True, default=generate_uuid)
    class_id = Column(String, index=True)
    topic_id = Column(String)
    claim_a = Column(JSON)
    claim_b = Column(JSON)
    winner = Column(String)
    reason = Column(String)
    trust_a = Column(Float)
    trust_b = Column(Float)
    overridden_by_educator = Column(Boolean)
    status = Column(String)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

class AssignmentDistribution(Base):
    __tablename__ = 'assignment_distributions'
    id = Column(String, primary_key=True, default=generate_uuid)
    assignment_id = Column(String, index=True)
    class_id = Column(String)
    learner_ids = Column(JSON)
    assigned_at = Column(DateTime)
    due_at = Column(DateTime)
    created_at = Column(DateTime, default=get_now)
    updated_at = Column(DateTime, default=get_now, onupdate=get_now)

def init_db(engine):
    Base.metadata.create_all(engine)
    # FTS5 table
    with engine.connect() as conn:
        conn.execute(
            text("CREATE VIRTUAL TABLE IF NOT EXISTS material_chunks_fts USING fts5(text, content='material_chunks', content_rowid='id');")
        )
        conn.commit()
