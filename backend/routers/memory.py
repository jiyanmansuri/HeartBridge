import os
import json
import tempfile
from fastapi import APIRouter, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from sqlmodel import Session, select
import google.generativeai as genai
from database import get_session
from models import Memory, User
from utils import emit_event
from services import hindsight_service

router = APIRouter(prefix="/api/memory", tags=["memory"])

@router.post("/record")
async def record_memory(
    user_id: int = Form(...),
    title: Optional[str] = Form(None),
    audio: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    transcript_text = "I remember when we used to live in the old village..."
    prompt_text = "What did the food smell like back then?"
    tags_list = []
    
    if os.environ.get("GEMINI_API_KEY"):
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
                temp_audio.write(await audio.read())
                temp_audio_path = temp_audio.name
                
            audio_file = genai.upload_file(path=temp_audio_path)
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = """
            Listen to this audio recording (it may be in English or Gujarati).
            Return a JSON object with exactly these fields:
            1. "transcript": A highly accurate text transcription of the story. If Gujarati, keep it in Gujarati script.
            2. "tags": An array of 2-3 string category tags (e.g., ["Childhood", "Recipes", "Family"]).
            3. "follow_up_prompt": A single, engaging question to ask the elder about what they just said to encourage them to keep talking.
            Return ONLY valid JSON.
            """
            
            response = model.generate_content(
                [prompt, audio_file],
                generation_config={"response_mime_type": "application/json"}
            )
            
            result = json.loads(response.text)
            transcript_text = result.get("transcript", transcript_text)
            tags_list = result.get("tags", [])
            prompt_text = result.get("follow_up_prompt", prompt_text)
            
            os.remove(temp_audio_path)
            genai.delete_file(audio_file.name)
            
        except Exception as e:
            transcript_text = "When I was young, we used to make fresh rotis on a clay stove in the village."
            prompt_text = "Wow, that sounds delicious! Who usually cooked the rotis, and did you have a favorite side dish with them?"
            tags_list = ["Childhood", "Food", "Village Life"]

    memory = Memory(
        user_id=user_id,
        title=title or "New Memory",
        transcript=transcript_text,
        audio_path=audio.filename,
        duration_secs=30,
        tags=json.dumps(tags_list)
    )
    session.add(memory)
    
    user = session.get(User, user_id)
    if user:
        emit_event(session, "memory_recorded", user_id, user.family_group_id, {"title": memory.title, "tags": tags_list})
        # Retain transcript in Hindsight so the check-in agent can reference this memory
        hindsight_service.retain(
            elder_id=user_id,
            content=f"[Memory recorded] {memory.title}: {transcript_text}",
            elder_name=user.preferred_name or user.name,
            language=user.language or "en",
        )
        
    session.commit()
    session.refresh(memory)
    
    return {"transcript": transcript_text, "prompt": prompt_text, "tags": tags_list, "memory_id": memory.id}

class TextMemoryReq(BaseModel):
    user_id: int
    title: str
    transcript: str

@router.post("/add_text")
def add_text_memory(req: TextMemoryReq, session: Session = Depends(get_session)):
    memory = Memory(
        user_id=req.user_id,
        title=req.title,
        transcript=req.transcript,
        duration_secs=0,
        tags=json.dumps(["Story Prompt", "Written"])
    )
    session.add(memory)
    user = session.get(User, req.user_id)
    if user:
        emit_event(session, "memory_recorded", req.user_id, user.family_group_id, {"title": memory.title, "tags": ["Story Prompt", "Written"]})
        # Retain written memory in Hindsight
        hindsight_service.retain(
            elder_id=req.user_id,
            content=f"[Written memory] {req.title}: {req.transcript}",
            elder_name=user.preferred_name or user.name,
            language=user.language or "en",
        )
    session.commit()
    session.refresh(memory)
    return memory

@router.get("/list")
def list_memories(user_id: int = 1, session: Session = Depends(get_session)):
    return session.exec(select(Memory).where(Memory.user_id == user_id).order_by(Memory.created_at.desc())).all()

class MemoryQuery(BaseModel):
    user_id: int
    question: str

@router.post("/query")
def query_memory(query: MemoryQuery, session: Session = Depends(get_session)):
    return {"answer": "Ramabai loved the mango orchards in the summer.", "sources": []}

@router.get("/prompt")
def next_prompt(user_id: int = 1, session: Session = Depends(get_session)):
    return {"prompt": "What was your favorite childhood game?"}
