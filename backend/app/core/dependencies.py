from fastapi import Depends, Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.settings import get_settings
from app.core.security import decode_access_token
from app.user_db.models import User
from app.core.context import AppContext

settings = get_settings()

user_engine = create_engine(settings.USER_DB_URL, connect_args={"check_same_thread": False})
course_engine = create_engine(settings.COURSE_DB_URL, connect_args={"check_same_thread": False})

UserSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=user_engine)
CourseSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=course_engine)

def get_user_db():
    db = UserSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_course_db():
    db = CourseSessionLocal()
    try:
        yield db
    finally:
        db.close()

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_user_db)) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def get_context(
    request: Request,
    user: User = Depends(get_current_user),
    user_db: Session = Depends(get_user_db),
    course_db: Session = Depends(get_course_db)
) -> AppContext:
    from app.personalization.llm.router import LLMRouter
    return AppContext(user=user, user_db=user_db, course_db=course_db, llm_router=LLMRouter())
