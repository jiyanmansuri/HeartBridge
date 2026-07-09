"""
hindsight_service.py
--------------------
Async wrapper around hindsight-client for HeartBridge.

Each elder gets their own bank_id: "elder-{elder_id}".
Every interaction is retained so the bank builds up automatically.
When the check-in agent generates a response it uses areflect() for
reasoning-level retrieval rather than plain arecall().

Falls back to localhost:8888 when HINDSIGHT_BASE_URL is not set.
All public functions are no-ops (returning None / []) when Hindsight
is unreachable, so the rest of the app keeps working.
"""

import os
import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Client singleton
# ---------------------------------------------------------------------------

def _get_client():
    """Return a Hindsight client, or None if the package isn't installed."""
    try:
        from hindsight_client import Hindsight  # type: ignore
    except ImportError:
        logger.warning("hindsight-client not installed — memory bank disabled.")
        return None

    base_url = os.getenv("HINDSIGHT_BASE_URL", "http://localhost:8888")
    try:
        return Hindsight(base_url=base_url)
    except Exception as exc:
        logger.warning("Failed to create Hindsight client: %s", exc)
        return None


_client = _get_client()

# Track which elder banks have already been configured.
_initialised_banks: set[str] = set()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _bank_id(elder_id: int) -> str:
    return f"elder-{elder_id}"


async def _ensure_bank_initialised(elder_id: int, elder_name: str, language: str) -> None:
    """Set mission on first use of this elder's bank (async)."""
    if _client is None:
        return
    bid = _bank_id(elder_id)
    if bid in _initialised_banks:
        return
    try:
        mission = (
            f"I'm a caring check-in companion for {elder_name}, "
            f"an elderly person who speaks {language} and lives with family support."
        )
        directives_text = [
            "Always flag missed medication.",
            "Flag any mention of pain, dizziness, chest tightness, falls, or breathing difficulty.",
            "Never give a medical diagnosis.",
            "Respond with warmth, patience, and cultural sensitivity.",
            "Summarise health concerns clearly so family members can act quickly.",
        ]
        if hasattr(_client, "aset_mission"):
            await _client.aset_mission(bank_id=bid, mission=mission)
        elif hasattr(_client, "set_mission"):
            _client.set_mission(bank_id=bid, mission=mission)

        # Some versions expose set_directives / aset_directives
        if hasattr(_client, "aset_directives"):
            await _client.aset_directives(bank_id=bid, directives=directives_text)
        elif hasattr(_client, "set_directives"):
            _client.set_directives(bank_id=bid, directives=directives_text)

        _initialised_banks.add(bid)
        logger.info("Hindsight bank initialised for %s (bank_id=%s)", elder_name, bid)
    except Exception as exc:
        logger.warning("Could not initialise Hindsight bank for elder %d: %s", elder_id, exc)


def _fire_and_forget(coro):
    """Schedule a coroutine on the running event loop without awaiting it."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(coro)
        else:
            loop.run_until_complete(coro)
    except Exception as exc:
        logger.warning("fire_and_forget failed: %s", exc)


# ---------------------------------------------------------------------------
# Public async API
# ---------------------------------------------------------------------------

async def aretain(elder_id: int, content: str, elder_name: str = "Elder", language: str = "en") -> None:
    """Async: persist content into the elder's Hindsight memory bank."""
    if _client is None or not content:
        return
    await _ensure_bank_initialised(elder_id, elder_name, language)
    try:
        await _client.aretain(bank_id=_bank_id(elder_id), content=content)
    except Exception as exc:
        logger.warning("Hindsight aretain() failed for elder %d: %s", elder_id, exc)


async def arecall(elder_id: int, query: str) -> list[str]:
    """Async: raw memory retrieval."""
    if _client is None:
        return []
    try:
        result = await _client.arecall(bank_id=_bank_id(elder_id), query=query)
        if isinstance(result, list):
            return [str(r) for r in result]
        return [str(result)] if result else []
    except Exception as exc:
        logger.warning("Hindsight arecall() failed for elder %d: %s", elder_id, exc)
        return []


async def areflect(elder_id: int, query: str) -> str:
    """Async: reasoning-level retrieval — Hindsight synthesises memories into a response."""
    if _client is None:
        return ""
    try:
        result = await _client.areflect(bank_id=_bank_id(elder_id), query=query)
        return str(result) if result else ""
    except Exception as exc:
        logger.warning("Hindsight areflect() failed for elder %d: %s", elder_id, exc)
        return ""


# ---------------------------------------------------------------------------
# Sync convenience wrappers (fire-and-forget for sync FastAPI endpoints)
# Used by mood.py, medicine.py etc. which are sync def
# ---------------------------------------------------------------------------

def retain(elder_id: int, content: str, elder_name: str = "Elder", language: str = "en") -> None:
    """
    Fire-and-forget retain for use inside sync FastAPI endpoints.
    Schedules the async retain on the running event loop without blocking.
    """
    _fire_and_forget(aretain(elder_id, content, elder_name, language))


def recall(elder_id: int, query: str) -> list[str]:
    """Sync recall — runs the coroutine to completion (for sync contexts only)."""
    if _client is None:
        return []
    try:
        return asyncio.get_event_loop().run_until_complete(arecall(elder_id, query))
    except Exception:
        return []


def reflect(elder_id: int, query: str) -> str:
    """Sync reflect — runs the coroutine to completion (for sync contexts only)."""
    if _client is None:
        return ""
    try:
        return asyncio.get_event_loop().run_until_complete(areflect(elder_id, query))
    except Exception:
        return ""
