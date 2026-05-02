"""
db_client.py
────────────
All HTTP calls from Pipeline 2 to the DB microservice.
Base URL: DB_SERVICE_URL (default http://localhost:5000)
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


# ── Read from DB (what P2 needs from P1's output) ────────────────────────────

def get_document(doc_id: str) -> dict:
    """GET /db/documents/{doc_id} — full document with full_text."""
    resp = _session.get(_url(f"/db/documents/{doc_id}"), timeout=10)
    resp.raise_for_status()
    return resp.json()


def get_clauses(doc_id: str) -> list[dict]:
    """GET /db/documents/{doc_id}/clauses — all clauses for a document."""
    resp = _session.get(_url(f"/db/documents/{doc_id}/clauses"), timeout=10)
    resp.raise_for_status()
    return resp.json()


# ── Write mapping results ─────────────────────────────────────────────────────

def insert_mapping_bulk(doc_id: str, mappings: list[dict]) -> None:
    """
    POST /db/mappings/clause/bulk
    Each mapping dict must have:
      clause_id, mapped_policy, department, gap_detected,
      mapping_confidence, reasoning, graph_policies,
      semantic_policies, mapping_status
    """
    resp = _session.post(
        _url("/db/mappings/clause/bulk"),
        json={"doc_id": doc_id, "mappings": mappings},
        timeout=30,
    )
    resp.raise_for_status()


def insert_mapping_summary(doc_id: str, total_clauses: int,
                            mapped_clauses: int, total_gaps: int,
                            status: str) -> None:
    """POST /db/mappings/document/{doc_id}/summary"""
    resp = _session.post(
        _url(f"/db/mappings/document/{doc_id}/summary"),
        json={
            "total_clauses":  total_clauses,
            "mapped_clauses": mapped_clauses,
            "total_gaps":     total_gaps,
            "status":         status,
        },
        timeout=10,
    )
    resp.raise_for_status()


# ── Pipeline status updates ───────────────────────────────────────────────────

def update_pipeline_status(doc_id: str, pipeline: str, status: str) -> None:
    """PATCH /db/pipeline-status/{doc_id}"""
    resp = _session.patch(
        _url(f"/db/pipeline-status/{doc_id}"),
        json={"pipeline": pipeline, "status": status},
        timeout=10,
    )
    resp.raise_for_status()