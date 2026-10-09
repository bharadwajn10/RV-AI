from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.dependencies import get_user_db, get_current_user
from app.core.security import verify_password, create_access_token
from app.user_db.models import User
from app.core.envelope import success, error

router = APIRouter()

class DemoLoginReq(BaseModel):
    role: str

class LoginReq(BaseModel):
    email: str
    password: str

@router.post("/demo-login")
def demo_login(req: DemoLoginReq, db: Session = Depends(get_user_db)):
    if req.role == "learner":
        user_id = "alex_learner"
    elif req.role == "educator":
        user_id = "varen_educator"
    else:
        return error("INVALID_ROLE", "Role must be learner or educator")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return error("NOT_FOUND", "Demo user not found")
        
    token = create_access_token({"sub": user.id, "role": user.role})
    return success({"token": token, "user": {"id": user.id, "role": user.role}})

@router.post("/login")
def login(req: LoginReq, db: Session = Depends(get_user_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        return error("UNAUTHORIZED", "Invalid credentials")
    
    token = create_access_token({"sub": user.id, "role": user.role})
    return success({"token": token, "user": {"id": user.id, "role": user.role}})

@router.post("/logout")
def logout():
    return success(True)

@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return success({
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "display_name": user.display_name,
        "ui_language": user.ui_language
    })
