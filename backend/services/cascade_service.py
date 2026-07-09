"""
cascade_service.py
------------------
CascadeFlow-powered model routing for HeartBridge check-ins.

Routing logic:
  - FAST tier  (Groq llama-3.3-70b-versatile) — routine daily check-ins
  - STRONG tier (Gemini 1.5 Pro / gemini-1.5-flash fallback) — health complaints,
    distress signals, or any message that triggers escalation

CASCADEFLOW_MODE defaults to "observe" (logs decisions, does not enforce them).
Switch to "enforce" once you've validated the routing is correct.

Falls back gracefully to Gemini if:
  - cascadeflow package is not installed
  - GROQ_API_KEY is missing
  - Groq request fails
"""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# CascadeFlow initialisation
# ---------------------------------------------------------------------------

_cascade_ready = False

def _init_cascadeflow() -> bool:
    try:
        import cascadeflow  # type: ignore
        mode = os.getenv("CASCADEFLOW_MODE", "observe")
        cascadeflow.init(mode=mode)
        logger.info("CascadeFlow initialised in '%s' mode.", mode)
        return True
    except ImportError:
        logger.warning("cascadeflow not installed — using direct model routing.")
        return False
    except Exception as exc:
        logger.warning("CascadeFlow init failed: %s", exc)
        return False


_cascade_ready = _init_cascadeflow()

# ---------------------------------------------------------------------------
# Distress / health-complaint keyword detection
# ---------------------------------------------------------------------------

_DISTRESS_KEYWORDS = {
    # English
    "pain", "hurt", "hurts", "ache", "aching", "dizzy", "dizziness",
    "chest", "breathe", "breathing", "breath", "fall", "fell", "fell down",
    "help", "emergency", "hospital", "ambulance", "scared", "afraid",
    "bleed", "bleeding", "unconscious", "faint", "fainted", "vomit",
    "nausea", "swelling", "swollen", "fever", "chills", "weak", "weakness",
    # Gujarati transliterations (common romanised forms)
    "dard", "dukhe", "chakkar", "chhati", "ghabhari", "madad", "dar lage",
    "padi gai", "padiyo", "hospital", "doctor",
}

def _is_distress(message: str) -> bool:
    """Heuristic check: does the message contain any distress/health keywords?"""
    lower = message.lower()
    return any(kw in lower for kw in _DISTRESS_KEYWORDS)


# ---------------------------------------------------------------------------
# Groq fast-tier call
# ---------------------------------------------------------------------------

def _call_groq(prompt: str) -> Optional[str]:
    """Call Groq with llama-3.3-70b-versatile. Returns None on failure."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.debug("GROQ_API_KEY not set — skipping fast tier.")
        return None
    try:
        from groq import Groq  # type: ignore
        client = Groq(api_key=api_key)
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=512,
            temperature=0.7,
        )
        return resp.choices[0].message.content
    except Exception as exc:
        logger.warning("Groq call failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Gemini strong-tier call
# ---------------------------------------------------------------------------

def _call_gemini(prompt: str) -> str:
    """Call Gemini. Falls back to a canned response if API key is missing."""
    try:
        import google.generativeai as genai  # type: ignore
        model = genai.GenerativeModel("gemini-1.5-flash")
        resp = model.generate_content(prompt)
        return resp.text
    except Exception as exc:
        logger.warning("Gemini call failed: %s", exc)
        return (
            "I'm here with you. It sounds like you might need some support right now. "
            "Please let your family know how you're feeling."
        )


# ---------------------------------------------------------------------------
# Public routing function
# ---------------------------------------------------------------------------

def route_checkin(
    elder_id: int,
    message: str,
    context: str = "",
    elder_name: str = "Elder",
) -> dict:
    """
    Route a check-in message to the appropriate model tier and audit the decision.
    """
    import time
    start_time = time.time()
    
    escalated = _is_distress(message)
    baseline_cost = 0.00500

    # Build prompt
    context_block = f"\n\nRecent context from memory:\n{context}" if context else ""
    if escalated:
        prompt = (
            f"You are a caring, attentive health companion for {elder_name}. "
            f"The elder has expressed a possible health concern or distress. "
            f"Respond with empathy, ask a focused clarifying question, and strongly "
            f"encourage them to contact family or a doctor if needed. "
            f"DO NOT give a medical diagnosis.{context_block}\n\n"
            f"Elder says: {message}"
        )
    else:
        prompt = (
            f"You are a warm and friendly daily check-in companion for {elder_name}. "
            f"Keep the conversation light, engaging, and brief. "
            f"Ask a single follow-up question about their day, medicines, or mood.{context_block}\n\n"
            f"Elder says: {message}"
        )

    # CascadeFlow observe-mode logging (non-blocking)
    if _cascade_ready:
        try:
            import cascadeflow  # type: ignore
            tier = "strong" if escalated else "fast"
            cascadeflow.log_routing(
                input=message,
                tier=tier,
                elder_id=str(elder_id),
                escalated=escalated,
            ) if hasattr(cascadeflow, "log_routing") else None
        except Exception:
            pass

    # Route to the correct tier
    if escalated:
        reply = _call_gemini(prompt)
        model_used = "gemini-1.5-flash (strong tier)"
        model_name = "gemini-1.5-flash"
        cost = 0.00030
        matched_words = [kw for kw in _DISTRESS_KEYWORDS if kw in message.lower()]
        rationale = f"Potential distress detected (keywords: {matched_words}). Routed to STRONG tier (Gemini 1.5 Flash) for safety compliance."
    else:
        reply = _call_groq(prompt)
        if reply is None:
            reply = _call_gemini(prompt)
            model_used = "gemini-1.5-flash (fast-tier fallback)"
            model_name = "gemini-1.5-flash"
            cost = 0.00030
            rationale = "Routine check-in, but Groq API failed. Fell back to STRONG tier (Gemini 1.5 Flash) for service continuity."
        else:
            model_used = "groq/llama-3.3-70b-versatile (fast tier)"
            model_name = "llama-3.3-70b-versatile"
            cost = 0.00015
            rationale = "Routine conversational check-in. Routed to FAST tier (Groq/Llama-3-70B) for 97% cost reduction."

    latency_ms = int((time.time() - start_time) * 1000)

    return {
        "reply": reply,
        "model_used": model_used,
        "model_name": model_name,
        "escalated": escalated,
        "cost": cost,
        "baseline_cost": baseline_cost,
        "latency_ms": latency_ms,
        "rationale": rationale
    }
