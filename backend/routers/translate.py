import os
import json
import urllib.request
import urllib.parse
from fastapi import APIRouter
from pydantic import BaseModel
import google.generativeai as genai

router = APIRouter(prefix="/api", tags=["translate"])

class TranslateRequest(BaseModel):
    text: str
    target_lang: str

@router.post("/translate")
def translate_text(req: TranslateRequest):
    return {"translated_text": req.text}
