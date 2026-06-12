from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session
from database import get_session
from models import User
from utils import emit_event

router = APIRouter(prefix="/api/mood", tags=["mood"])

class AddMoodReq(BaseModel):
    user_id: int
    mood: str

@router.post("/add")
def add_mood(req: AddMoodReq, session: Session = Depends(get_session)):
    user = session.get(User, req.user_id)
    if user:
        emit_event(session, "mood_logged", req.user_id, user.family_group_id, {"mood": req.mood})
    return {"status": "ok"}
