import os
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session
import google.generativeai as genai
from database import get_session
from models import User
from utils import emit_event

router = APIRouter(tags=["nudge"])

class NudgeReq(BaseModel):
    user_id: int
    message: str

@router.post("/api/family/nudge")
def send_nudge(req: NudgeReq, session: Session = Depends(get_session)):
    user = session.get(User, req.user_id)
    if user:
        emit_event(session, "nudge_sent", req.user_id, user.family_group_id, {"message": req.message})
    return {"status": "ok"}

class AlertReq(BaseModel):
    user_id: int
    medicine_name: str
    message: str

@router.post("/api/family/alert")
def send_alert(req: AlertReq, session: Session = Depends(get_session)):
    user = session.get(User, req.user_id)
    if user:
        emit_event(session, "emergency_alert", req.user_id, user.family_group_id, {
            "medicine_name": req.medicine_name,
            "message": req.message
        })
    return {"status": "ok"}

class MedicalSummaryReq(BaseModel):
    user_id: int
    transcript: str

@router.post("/api/medical_summary/generate")
def generate_medical_summary(req: MedicalSummaryReq, session: Session = Depends(get_session)):
    user = session.get(User, req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if os.environ.get("GEMINI_API_KEY"):
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            You are a medical assistant. Convert the following conversation transcript with an elderly patient into a clean medical summary for their doctor.
            Extract and format as JSON with exactly these fields:
            1. "chief_complaint": string
            2. "duration": string
            3. "severity": integer (1-10) or null
            4. "red_flags": array of strings (or empty)
            5. "current_medicines": array of strings (or empty)
            6. "notes": string (brief summary)
            
            Transcript:
            {req.transcript}
            """
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            result = json.loads(response.text)
            emit_event(session, "medical_summary", req.user_id, user.family_group_id, result)
            return result
        except Exception as e:
            print("Gemini API Error for medical summary:", e)
            
    fallback = {
        "chief_complaint": "General checkup conversation",
        "duration": "Recent",
        "severity": 3,
        "red_flags": [],
        "current_medicines": ["Unknown"],
        "notes": "Generated fallback summary due to API error or no API key."
    }
    emit_event(session, "medical_summary", req.user_id, user.family_group_id, fallback)
    return fallback

class FamilyMessageReq(BaseModel):
    user_id: int
    message: str

@router.post("/api/family/message")
def send_family_message(req: FamilyMessageReq, session: Session = Depends(get_session)):
    user = session.get(User, req.user_id)
    if user:
        emit_event(session, "voice_message", req.user_id, user.family_group_id, {"message": req.message})
    return {"status": "ok"}
