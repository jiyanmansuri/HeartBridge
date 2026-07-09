from typing import Optional, List
from sqlmodel import SQLModel, Field
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    preferred_name: Optional[str] = None
    language: str = "en"
    device_token: Optional[str] = None
    is_elder: bool = False
    family_group_id: Optional[int] = None
    age: Optional[int] = None
    location: Optional[str] = None
    conditions: Optional[str] = None
    relationship: Optional[str] = None
    timezone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FamilyGroup(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    event_type: str
    user_id: int
    family_group_id: int
    payload: str  # JSON string
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Medicine(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    name: str
    dose: str
    schedule: str  # Comma-separated times (HH:MM)
    color_hex: str
    photo_path: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MedicineLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    medicine_id: int
    scheduled_at: datetime
    taken_at: Optional[datetime] = None

class Memory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    title: Optional[str] = None
    transcript: str
    audio_path: Optional[str] = None
    embedding_id: Optional[str] = None
    duration_secs: Optional[int] = None
    tags: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Photo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    file_path: str
    event_tag: Optional[str] = None
    caption_audio_path: Optional[str] = None
    transcript: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CirclePost(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    category: str
    content_text: str
    media_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RoutingAuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    elder_id: int
    task_type: str
    model_name: str
    rationale: str
    cost: float
    baseline_cost: float
    latency_ms: int
    memories_recalled: Optional[str] = None
    input_text: str
    response_text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
