"""
checkin.py
----------
POST /api/checkin  — the main check-in agent loop for HeartBridge.

Flow:
  1. Load elder from DB
  2. aretain() the incoming message in Hindsight (async)
  3. areflect() to get a synthesised memory context (async)
  4. route_checkin() → CascadeFlow selects fast (Groq) or strong (Gemini) tier
  5. aretain() the agent's reply (async)
  6. emit_event() for the family dashboard
  7. If escalated, emit an additional "health_alert" event
"""

import os
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlmodel import Session, select
from database import get_session
from models import User, RoutingAuditLog
from utils import emit_event
from services import hindsight_service, cascade_service

router = APIRouter(prefix="/api/checkin", tags=["checkin"])


class CheckinRequest(BaseModel):
    user_id: int
    message: str
    session_id: Optional[str] = None


class CheckinResponse(BaseModel):
    reply: str
    model_used: str
    escalated: bool
    memories_used: list[str]


@router.post("", response_model=CheckinResponse)
async def checkin(req: CheckinRequest, session: Session = Depends(get_session)):
    """
    Main check-in endpoint. Accepts the elder's spoken/typed message and
    returns a contextualised, model-routed reply.
    """
    elder = session.get(User, req.user_id)
    if not elder:
        raise HTTPException(status_code=404, detail="Elder not found.")

    elder_name = elder.preferred_name or elder.name
    language = elder.language or "en"

    # 1. Retain the incoming message (async, non-blocking)
    await hindsight_service.aretain(
        elder_id=elder.id,
        content=f"[Check-in] Elder said: {req.message}",
        elder_name=elder_name,
        language=language,
    )

    # 2. Get raw memories and a synthesised reflect() context
    memories = await hindsight_service.arecall(
        elder_id=elder.id,
        query="recent mood, health complaints, medication status",
    )
    reflected_context = await hindsight_service.areflect(
        elder_id=elder.id,
        query=f"What do I need to know about {elder_name}'s recent health and mood to respond helpfully?",
    )

    # Combine context for prompt
    context_parts = []
    if reflected_context:
        context_parts.append(reflected_context)
    elif memories:
        context_parts.extend(memories[:5])
    context_str = "\n".join(context_parts)

    # 3. Route to fast or strong model tier (sync — runs in threadpool if needed)
    result = cascade_service.route_checkin(
        elder_id=elder.id,
        message=req.message,
        context=context_str,
        elder_name=elder_name,
    )

    reply = result["reply"]
    model_used = result["model_used"]
    escalated = result["escalated"]

    # Save to RoutingAuditLog table
    audit_entry = RoutingAuditLog(
        elder_id=elder.id,
        task_type="Medical distress check-in" if escalated else "Routine daily check-in",
        model_name=result["model_name"],
        rationale=result["rationale"],
        cost=result["cost"],
        baseline_cost=result["baseline_cost"],
        latency_ms=result["latency_ms"],
        memories_recalled=json.dumps(memories[:5] if memories else []),
        input_text=req.message,
        response_text=reply
    )
    session.add(audit_entry)
    session.commit()
    session.refresh(audit_entry)

    # 4. Retain the agent's reply
    await hindsight_service.aretain(
        elder_id=elder.id,
        content=f"[Agent reply via {model_used}]: {reply}",
        elder_name=elder_name,
        language=language,
    )

    # 5. Emit events for the family dashboard
    if elder.family_group_id:
        emit_event(
            session,
            "checkin_completed",
            elder.id,
            elder.family_group_id,
            {
                "message": req.message,
                "reply": reply,
                "model_used": model_used,
                "escalated": escalated,
            },
        )
        
        emit_event(
            session,
            "ai_audit_created",
            elder.id,
            elder.family_group_id,
            {
                "audit_id": audit_entry.id,
                "model_name": audit_entry.model_name,
                "cost": audit_entry.cost,
                "latency_ms": audit_entry.latency_ms,
                "rationale": audit_entry.rationale
            }
        )

        if escalated:
            # Query family members for this group to customize the notification copy
            family_members = session.exec(
                select(User)
                .where(User.family_group_id == elder.family_group_id, User.is_elder == False)
            ).all()

            from datetime import datetime
            from zoneinfo import ZoneInfo

            family_details = []
            for fm in family_members:
                fm_tz = fm.timezone or "America/Toronto"
                fm_loc = fm.location or "Toronto, Canada"
                fm_city = fm_loc.split(',')[0].strip()
                fm_first_name = fm.name.split(' ')[0]
                
                try:
                    fm_now = datetime.now(ZoneInfo(fm_tz))
                    fm_time_str = fm_now.strftime("%I:%M %p").lstrip('0')
                except Exception:
                    fm_time_str = datetime.utcnow().strftime("%I:%M %p").lstrip('0')
                
                family_details.append(f"{fm_first_name} ({fm_city}) at {fm_time_str} local time")

            if family_details:
                note_copy = f"Health alert for {elder_name} — sent to " + " and ".join(family_details) + "."
            else:
                note_copy = f"Health alert for {elder_name} — sent to family."

            emit_event(
                session,
                "health_alert",
                elder.id,
                elder.family_group_id,
                {
                    "alert_source": "checkin_agent",
                    "elder_message": req.message,
                    "agent_reply": reply,
                    "note": note_copy,
                },
            )

    return CheckinResponse(
        reply=reply,
        model_used=model_used,
        escalated=escalated,
        memories_used=memories[:5] if memories else [],
    )


@router.get("/audit")
def get_audit_trail(family_group_id: int, session: Session = Depends(get_session)):
    # Get all elders in this family group
    elders = session.exec(select(User).where(User.family_group_id == family_group_id, User.is_elder == True)).all()
    elder_ids = [e.id for e in elders]
    if not elder_ids:
        return {
            "logs": [],
            "stats": {
                "total_requests": 0,
                "total_cost": 0.0,
                "baseline_cost": 0.0,
                "savings_usd": 0.0,
                "savings_pct": 0.0,
                "avg_latency": 0
            }
        }
    
    # Query logs
    logs = session.exec(
        select(RoutingAuditLog)
        .where(RoutingAuditLog.elder_id.in_(elder_ids))
        .order_by(RoutingAuditLog.created_at.desc())
    ).all()
    
    # Compute summary stats
    total_requests = len(logs)
    total_cost = sum(log.cost for log in logs)
    baseline_cost = sum(log.baseline_cost for log in logs)
    savings_usd = max(0.0, baseline_cost - total_cost)
    savings_pct = int((savings_usd / baseline_cost) * 100) if baseline_cost > 0 else 0
    avg_latency = int(sum(log.latency_ms for log in logs) / total_requests) if total_requests > 0 else 0
    
    return {
        "logs": [
            {
                "id": log.id,
                "elder_id": log.elder_id,
                "task_type": log.task_type,
                "model_name": log.model_name,
                "rationale": log.rationale,
                "cost": log.cost,
                "baseline_cost": log.baseline_cost,
                "latency_ms": log.latency_ms,
                "memories_recalled": json.loads(log.memories_recalled) if log.memories_recalled else [],
                "input_text": log.input_text,
                "response_text": log.response_text,
                "created_at": log.created_at.isoformat()
            }
            for log in logs
        ],
        "stats": {
            "total_requests": total_requests,
            "total_cost": round(total_cost, 5),
            "baseline_cost": round(baseline_cost, 5),
            "savings_usd": round(savings_usd, 5),
            "savings_pct": savings_pct,
            "avg_latency": avg_latency
        }
    }
