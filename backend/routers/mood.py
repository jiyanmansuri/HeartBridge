from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session
from database import get_session
from models import User
from utils import emit_event
from services import hindsight_service

router = APIRouter(prefix="/api/mood", tags=["mood"])

class AddMoodReq(BaseModel):
    user_id: int
    mood: str

@router.post("/add")
def add_mood(req: AddMoodReq, session: Session = Depends(get_session)):
    user = session.get(User, req.user_id)
    if user:
        emit_event(session, "mood_logged", req.user_id, user.family_group_id, {"mood": req.mood})
        # Retain mood in Hindsight so the check-in agent tracks emotional patterns
        hindsight_service.retain(
            elder_id=req.user_id,
            content=f"[Mood log] {user.preferred_name or user.name} reported mood: {req.mood}",
            elder_name=user.preferred_name or user.name,
            language=user.language or "en",
        )
    return {"status": "ok"}
