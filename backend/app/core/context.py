from sqlalchemy.orm import Session
from app.user_db.models import User

class AppContext:
    def __init__(self, user: User, user_db: Session, course_db: Session, llm_router=None, clock=None):
        self.user = user
        self.user_db = user_db
        self.course_db = course_db
        self.llm_router = llm_router
        self.clock = clock
