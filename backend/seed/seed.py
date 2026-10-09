import os
import sys
import json
import datetime
import asyncio
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.settings import get_settings
from app.user_db.models import Base as UserBase, init_db as init_user_db, User, LearnerProfile, EducatorProfile, ClassModel, Enrollment
from app.course_db.models import Base as CourseBase, init_db as init_course_db, Subject, Topic, Plan, PlanItem

settings = get_settings()

os.makedirs("./data", exist_ok=True)
user_engine = create_engine(settings.USER_DB_URL, echo=False)
course_engine = create_engine(settings.COURSE_DB_URL, echo=False)

UserSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=user_engine)
CourseSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=course_engine)

def seed():
    # 1. Initialize databases
    init_user_db(user_engine)
    init_course_db(course_engine)
    
    user_db = UserSessionLocal()
    course_db = CourseSessionLocal()
    
    try:
        # Clear existing data for a clean seed
        UserBase.metadata.drop_all(user_engine)
        CourseBase.metadata.drop_all(course_engine)
        init_user_db(user_engine)
        init_course_db(course_engine)
        
        # 2. Users
        alex_learner = User(id="alex_learner", email="alex@example.com", password_hash="dummy", role="learner", status="active", full_name="Alex Student", display_name="Alex")
        varen_educator = User(id="varen_educator", email="varen@example.com", password_hash="dummy", role="educator", status="active", full_name="Dr. Varen", display_name="Varen")
        
        user_db.add_all([alex_learner, varen_educator])
        
        # 3. Profiles
        alex_profile = LearnerProfile(user_id=alex_learner.id, reading_level="C1", explanation_depth="standard", pace="normal")
        varen_profile = EducatorProfile(user_id=varen_educator.id)
        user_db.add_all([alex_profile, varen_profile])
        
        # 4. Course DB - Subjects & Topics
        ds_subject = Subject(id="data-structures", name="Data Structures", category="Core", icon="🌳", description="Organize information and solve problems efficiently.")
        db_subject = Subject(id="database-management-systems", name="Database Management Systems", category="Databases", icon="🗄️", description="Learn how to design, query, and manage databases.")
        course_db.add_all([ds_subject, db_subject])
        
        # Topics for Data Structures
        t1 = Topic(id="arrays-and-strings", subject_id="data-structures", name="Arrays and Strings", est_minutes=120, difficulty="Medium", order_index=1)
        t2 = Topic(id="linked-lists", subject_id="data-structures", name="Linked Lists", est_minutes=120, difficulty="Easy", order_index=2)
        t3 = Topic(id="stacks-and-queues", subject_id="data-structures", name="Stacks and Queues", est_minutes=90, difficulty="Easy", order_index=3)
        t4 = Topic(id="trees-and-graphs", subject_id="data-structures", name="Trees and Graphs", est_minutes=180, difficulty="Hard", order_index=4)
        course_db.add_all([t1, t2, t3, t4])
        
        # 5. User DB - Class & Enrollment
        cls1 = ClassModel(id="ds-class-1", educator_id=varen_educator.id, subject_id="data-structures", name="Data Structures Fall 2026", status="active")
        user_db.add(cls1)
        
        enr1 = Enrollment(class_id=cls1.id, learner_id=alex_learner.id, subject_id="data-structures", status="enrolled", joined_at=datetime.datetime.utcnow())
        user_db.add(enr1)
        
        user_db.commit()
        course_db.commit()
        print("Successfully seeded databases.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        user_db.rollback()
        course_db.rollback()
    finally:
        user_db.close()
        course_db.close()

if __name__ == "__main__":
    seed()
