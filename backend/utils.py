from sqlmodel import Session
import json
from models import Event

elder_heartbeats = {}

def emit_event(session: Session, event_type: str, user_id: int, family_group_id: int, payload: dict):
    event = Event(
        event_type=event_type,
        user_id=user_id,
        family_group_id=family_group_id,
        payload=json.dumps(payload)
    )
    session.add(event)
    session.commit()
