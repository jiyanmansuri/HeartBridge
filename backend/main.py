from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
import os
import google.generativeai as genai
from dotenv import load_dotenv

from database import engine, create_db_and_tables
from models import User, FamilyGroup, Medicine

from routers import auth, health, family, memory, translate, medicine, mood, nudge, photo, circle, checkin

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
app.include_router(checkin.router)

@app.on_event("startup")
async def on_startup():
    os.makedirs("uploads", exist_ok=True)
    create_db_and_tables()
    with Session(engine) as session:
        if not session.exec(select(User)).first():
            fg = FamilyGroup(name="Higgins Family")
            session.add(fg)
            session.commit()
            session.refresh(fg)
            
            elder = User(
                name="Margaret Higgins", 
                preferred_name="Margaret",
                language="en", 
                is_elder=True, 
                family_group_id=fg.id,
                age=72,
                location="Dublin, Ireland",
                conditions="diabetic, on Metformin and Amlodipine",
                timezone="Europe/Dublin"
            )
            family1 = User(
                name="Thomas Higgins", 
                relationship="son",
                location="Toronto, Canada",
                timezone="America/Toronto",
                is_elder=False, 
                family_group_id=fg.id
            )
            family2 = User(
                name="Claire Higgins",
                relationship="daughter",
                location="London, UK",
                timezone="Europe/London",
                is_elder=False,
                family_group_id=fg.id
            )
            session.add(elder)
            session.add(family1)
            session.add(family2)
            session.commit()
            
            med1 = Medicine(user_id=elder.id, name="Amlodipine", dose="5mg", schedule="09:00", color_hex="#8FCFA0")
            med2 = Medicine(user_id=elder.id, name="Metformin", dose="500mg", schedule="09:00,20:00", color_hex="#F5C842")
            session.add(med1)
            session.add(med2)
            session.commit()

            # Second demo family for London/Dubai context
            fg2 = FamilyGroup(name="Silva Family")
            session.add(fg2)
            session.commit()
            session.refresh(fg2)

            elder2 = User(
                name="Maria Silva",
                preferred_name="Maria",
                language="en",
                is_elder=True,
                family_group_id=fg2.id,
                age=72,
                location="Lisbon, Portugal",
                conditions="hypertension",
                timezone="Europe/Dublin"
            )
            family3 = User(
                name="Lucas Silva",
                relationship="daughter",
                location="Dubai, UAE",
                timezone="Asia/Dubai",
                is_elder=False,
                family_group_id=fg2.id
            )
            session.add(elder2)
            session.add(family3)
            session.commit()

            med3 = Medicine(user_id=elder2.id, name="Metoprolol", dose="25mg", schedule="08:00", color_hex="#F5C842")
            session.add(med3)
            session.commit()

        # Seed Hindsight banks for all elders (async — runs safely inside uvicorn loop)
        from services import hindsight_service
        elders = session.exec(select(User).where(User.is_elder == True)).all()
        for e in elders:
            await hindsight_service.aretain(
                elder_id=e.id,
                content=f"[System] HeartBridge started. Companion ready for {e.preferred_name or e.name}.",
                elder_name=e.preferred_name or e.name,
                language=e.language or "en",
            )
