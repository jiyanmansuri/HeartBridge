import os
import shutil
import random
import json
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlmodel import Session, select
from typing import Optional, List
from pydantic import BaseModel
import google.generativeai as genai
from database import get_session
from models import Photo, User
from utils import emit_event

router = APIRouter(prefix="/api/photo", tags=["photo"])

@router.post("/upload")
async def upload_photo(
    user_id: int = Form(...),
    photo: UploadFile = File(...),
    event_tag: Optional[str] = Form(None),
    session: Session = Depends(get_session)
):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{photo.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)
        
    tag = event_tag
    if not tag:
        tag = "Misc"
        if os.environ.get("GEMINI_API_KEY"):
            try:
                model = genai.GenerativeModel('gemini-1.5-flash')
                image_file = genai.upload_file(path=file_path)
                prompt = "Analyze this image and return a JSON object with a single field 'event_tag' containing a short 2-3 word descriptive tag for the event shown (e.g., 'Diwali Celebrations', 'Family Dinner', 'Park Walk'). Return ONLY valid JSON."
                
                response = model.generate_content(
                    [prompt, image_file],
                    generation_config={"response_mime_type": "application/json"}
                )
                result = json.loads(response.text)
                tag = result.get("event_tag", "Misc")
                genai.delete_file(image_file.name)
            except Exception as e:
                print("Gemini API Error for photo sort:", e)
            
    photo_record = Photo(
        user_id=user_id,
        file_path=file_path,
        event_tag=tag
    )
    session.add(photo_record)
    user = session.get(User, user_id)
    if user:
        emit_event(session, "photo_uploaded", user_id, user.family_group_id, {"file_path": file_path, "event_tag": tag})
    session.commit()
    session.refresh(photo_record)
    return photo_record

class PhotoShareReq(BaseModel):
    photo_ids: List[int]
    target_user_ids: List[int]

@router.post("/share")
def share_photos(req: PhotoShareReq, session: Session = Depends(get_session)):
    if not req.photo_ids or not req.target_user_ids:
        return {"status": "ok"}
        
    photos = session.exec(select(Photo).where(Photo.id.in_(req.photo_ids))).all()
    if not photos:
        return {"status": "error", "msg": "Photos not found"}
        
    elder_user_id = photos[0].user_id
    elder_user = session.get(User, elder_user_id)
    
    if elder_user:
        payload = {
            "photo_ids": [p.id for p in photos],
            "file_paths": [p.file_path for p in photos],
            "target_user_ids": req.target_user_ids,
            "message": f"{elder_user.name} shared {len(photos)} memory(s) with you."
        }
        emit_event(session, "photo_shared", elder_user_id, elder_user.family_group_id, payload)
        
    return {"status": "ok"}

@router.get("/list")
def list_photos(user_id: int = 1, session: Session = Depends(get_session)):
    photos = session.exec(select(Photo).where(Photo.user_id == user_id).order_by(Photo.created_at.desc())).all()
    grouped = {}
    for p in photos:
        tag = p.event_tag or "Misc"
        if tag not in grouped:
            grouped[tag] = []
        grouped[tag].append(p)
    
    return [{"event_tag": k, "photos": v} for k, v in grouped.items()]

@router.post("/{photo_id}/caption")
async def caption_photo(
    photo_id: int,
    audio: UploadFile = File(...),
    transcript: Optional[str] = Form(None),
    session: Session = Depends(get_session)
):
    photo_record = session.get(Photo, photo_id)
    if not photo_record:
        raise HTTPException(status_code=404, detail="Photo not found")
        
    os.makedirs("uploads", exist_ok=True)
    audio_path = f"uploads/{audio.filename}"
    
    with open(audio_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)
        
    transcript_text = transcript or "A beautiful memory attached."
    if not transcript and os.environ.get("GEMINI_API_KEY"):
        try:
            audio_file = genai.upload_file(path=audio_path)
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = "Listen to this audio recording and return a JSON object with a single field 'transcript' containing the exact text transcription in its original language. Return ONLY valid JSON."
            response = model.generate_content(
                [prompt, audio_file],
                generation_config={"response_mime_type": "application/json"}
            )
            result = json.loads(response.text)
            transcript_text = result.get("transcript", transcript_text)
            genai.delete_file(audio_file.name)
        except Exception as e:
            print("Gemini API Error for audio caption:", e)
            
    photo_record.caption_audio_path = audio_path
    photo_record.transcript = transcript_text
    session.add(photo_record)
    session.commit()
    session.refresh(photo_record)
    return photo_record

@router.get("/on_this_day")
def on_this_day(user_id: int = 1, session: Session = Depends(get_session)):
    photos = session.exec(select(Photo).where(Photo.user_id == user_id)).all()
    if not photos:
        return None
    return random.choice(photos)
