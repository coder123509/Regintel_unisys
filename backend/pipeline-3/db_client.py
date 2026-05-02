"""
db_client.py
────────────
All HTTP calls from Pipeline 3 to the DB microservice.
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

_BASE = os.getenv("DB_SERVICE_URL", "http://localhost:5000")
_session = requests.Session()
_session.headers.update({"Content-Type": "application/json"})


def _url(path: str) -> str:
    return f"{_BASE}{path}"


# ── Read from DB (P2 output that P3 needs) ────────────────────────────────────

def get_clause_mappings(doc_id: str) -> list[dict]:
    """GET /db/mappings/document/{doc_id} — all mapped clauses for a doc."""
    resp = _session.get(_url(f"/db/mappings/document/{doc_id}"), timeout=10)
    resp.raise_for_status()
    return resp.json()


def get_clauses(doc_id: str) -> list[dict]:
    """GET /db/documents/{doc_id}/clauses — raw clauses (for deadline etc)."""
    resp = _session.get(_url(f"/db/documents/{doc_id}/clauses"), timeout=10)
    resp.raise_for_status()
    return resp.json()


# ── Write risk scores ─────────────────────────────────────────────────────────

def insert_risk(doc_id: str, clause_id: str | None, risk_score: float,
                severity: float, impact: float, urgency: float,
                priority: str) -> None:
    """
    POST /db/risk
    Works for both doc-level (clause_id=None) and clause-level.
    """
    resp = _session.post(
        _url("/db/risk"),
        json={
            "doc_id":     doc_id,
            "clause_id":  clause_id,
            "risk_score": risk_score,
            "severity":   severity,
            "impact":     impact,
            "urgency":    urgency,
            "priority":   priority,
        },
        timeout=10,
    )
    resp.raise_for_status()


# ── Write actions ─────────────────────────────────────────────────────────────

def insert_actions_bulk(doc_id: str, actions: list[dict]) -> int:
    """
    POST /db/actions/bulk
    Each action: clause_id, action_text, action_type, department
    Returns number inserted.
    """
    resp = _session.post(
        _url("/db/actions/bulk"),
        json={"doc_id": doc_id, "actions": actions},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json().get("inserted", len(actions))


# ── Pipeline status ───────────────────────────────────────────────────────────

def update_pipeline_status(doc_id: str, pipeline: str, status: str) -> None:
    """PATCH /db/pipeline-status/{doc_id}"""
    resp = _session.patch(
        _url(f"/db/pipeline-status/{doc_id}"),
        json={"pipeline": pipeline, "status": status},
        timeout=10,
    )
    resp.raise_for_status()