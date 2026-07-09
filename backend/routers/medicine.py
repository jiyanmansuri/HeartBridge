import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlmodel import Session, select
from typing import Optional
from database import get_session
from models import Medicine, MedicineLog, User
from utils import elder_heartbeats, emit_event
from services import hindsight_service

router = APIRouter(prefix="/api/medicine", tags=["medicine"])

@router.get("/today")
def medicine_today(user_id: int = 1, session: Session = Depends(get_session)):
    elder_heartbeats[user_id] = datetime.utcnow()
    medicines = session.exec(select(Medicine).where(Medicine.user_id == user_id, Medicine.active == True)).all()
    today = datetime.utcnow().date()
    
    result = []
    for med in medicines:
        times = med.schedule.split(",")
        for t in times:
            hour, minute = map(int, t.split(":"))
            scheduled_at = datetime(today.year, today.month, today.day, hour, minute)
            
            log = session.exec(select(MedicineLog).where(MedicineLog.medicine_id == med.id, MedicineLog.scheduled_at == scheduled_at)).first()
            taken = bool(log and log.taken_at)
            
            result.append({
                "medicine_id": med.id,
                "name": med.name,
                "dose": med.dose,
                "color_hex": med.color_hex,
                "photo_path": med.photo_path,
                "scheduled_at": scheduled_at.isoformat(),
                "taken": taken,
                "taken_at": log.taken_at.isoformat() if taken else None
            })
            
    result.sort(key=lambda x: x["scheduled_at"])
    return result

@router.post("/take/{medicine_id}")
def take_medicine(medicine_id: int, scheduled_at: str, user_id: int = 1, session: Session = Depends(get_session)):
    dt_scheduled = datetime.fromisoformat(scheduled_at)
    
    log = session.exec(select(MedicineLog).where(MedicineLog.medicine_id == medicine_id, MedicineLog.scheduled_at == dt_scheduled)).first()
    if not log:
        log = MedicineLog(medicine_id=medicine_id, scheduled_at=dt_scheduled, taken_at=datetime.utcnow())
        session.add(log)
    else:
        log.taken_at = datetime.utcnow()
        session.add(log)
        
    med = session.get(Medicine, medicine_id)
    user = session.get(User, user_id)
    
    if med and user:
        emit_event(session, "medicine_taken", user_id, user.family_group_id, {"medicine_name": med.name, "dose": med.dose})
        # Retain medication adherence in Hindsight
        hindsight_service.retain(
            elder_id=user_id,
            content=f"[Medication] {user.preferred_name or user.name} took {med.name} {med.dose} at {datetime.utcnow().strftime('%H:%M UTC')}",
            elder_name=user.preferred_name or user.name,
            language=user.language or "en",
        )
        
    session.commit()
    return {"status": "ok"}

@router.post("/add")
async def add_medicine(
    user_id: int = Form(...),
    name: str = Form(...),
    dose: str = Form(...),
    schedule: str = Form(...),
    color_hex: str = Form(...),
    photo: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session)
):
    photo_path = None
    if photo:
        os.makedirs("uploads", exist_ok=True)
        photo_path = f"uploads/{photo.filename}"
        with open(photo_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
            
    med = Medicine(
        user_id=user_id,
        name=name,
        dose=dose,
        schedule=schedule,
        color_hex=color_hex,
        photo_path=photo_path
    )
    session.add(med)
    session.commit()
    session.refresh(med)
    return med

@router.delete("/delete/{medicine_id}")
def delete_medicine(medicine_id: int, session: Session = Depends(get_session)):
    med = session.get(Medicine, medicine_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    med.active = False
    session.add(med)
    session.commit()
    return {"status": "ok"}

@router.get("/history")
def medicine_history(user_id: int = 1, days: int = 7, session: Session = Depends(get_session)):
    return []
