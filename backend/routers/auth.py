from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional
from database import get_session
from models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    name: str
    is_elder: bool

@router.get("/users")
def get_auth_users(is_elder: Optional[bool] = None, session: Session = Depends(get_session)):
    query = select(User)
    if is_elder is not None:
        query = query.where(User.is_elder == is_elder)
    return session.exec(query).all()

@router.post("/login")
def login(req: LoginRequest, session: Session = Depends(get_session)):
    users = session.exec(
        select(User)
        .where(User.is_elder == req.is_elder)
    ).all()
    matched_user = None
    req_name_clean = req.name.strip().lower()
    
    # 1. Exact match
    for u in users:
        if u.name.strip().lower() == req_name_clean:
            matched_user = u
            break
            
    # 2. First name match
    if not matched_user:
        for u in users:
            first_name = u.name.split(' ')[0].lower()
            if first_name == req_name_clean:
                matched_user = u
                break
                
    # 3. Substring match
    if not matched_user:
        for u in users:
            if req_name_clean in u.name.lower():
                matched_user = u
                break
                
    if not matched_user:
        raise HTTPException(status_code=404, detail="User not found")
    return matched_user
