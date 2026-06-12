from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
import os
import google.generativeai as genai
from dotenv import load_dotenv

from database import engine, create_db_and_tables
from models import User, FamilyGroup, Medicine

from routers import auth, health, family, memory, translate, medicine, mood, nudge, photo, circle

load_dotenv()
if os.environ.get("GEMINI_API_KEY"):
    genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

app = FastAPI(title="HeartBridge", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(family.router)
app.include_router(memory.router)
app.include_router(translate.router)
app.include_router(medicine.router)
app.include_router(mood.router)
app.include_router(nudge.router)
app.include_router(photo.router)
app.include_router(circle.router)

@app.on_event("startup")
def on_startup():
    os.makedirs("uploads", exist_ok=True)
    create_db_and_tables()
    with Session(engine) as session:
        if not session.exec(select(User)).first():
            fg = FamilyGroup(name="Patel Family")
            session.add(fg)
            session.commit()
            session.refresh(fg)
            
            elder = User(name="Ramabai", language="gu", is_elder=True, family_group_id=fg.id)
            family = User(name="Arjun", is_elder=False, family_group_id=fg.id)
            session.add(elder)
            session.add(family)
            session.commit()
            
            med1 = Medicine(user_id=elder.id, name="Amlodipine", dose="5mg", schedule="09:00", color_hex="#8FCFA0")
            med2 = Medicine(user_id=elder.id, name="Metformin", dose="500mg", schedule="09:00,20:00", color_hex="#F5C842")
            session.add(med1)
            session.add(med2)
            session.commit()
