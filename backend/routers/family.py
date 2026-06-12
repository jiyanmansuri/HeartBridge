from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from database import get_session
from models import Event

router = APIRouter(prefix="/api/family", tags=["family"])

@router.get("/feed")
def get_family_feed(family_group_id: int = 1, session: Session = Depends(get_session)):
    events = session.exec(
        select(Event)
        .where(Event.family_group_id == family_group_id)
        .order_by(Event.created_at.desc())
        .limit(50)
    ).all()
    return events
