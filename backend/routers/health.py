from fastapi import APIRouter
from datetime import datetime
from utils import elder_heartbeats

router = APIRouter(tags=["health"])

@router.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0"}

@router.get("/api/elder/{user_id}/status")
def get_elder_status(user_id: int):
    last_active = elder_heartbeats.get(user_id)
    if not last_active:
        return {"online": False, "last_active": "Never"}
    
    is_online = (datetime.utcnow() - last_active).total_seconds() < 25
    return {
        "online": is_online,
        "last_active": last_active.isoformat()
    }
