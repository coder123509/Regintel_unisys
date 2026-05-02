"""
db_client.py
------------
All communication with the DB microservice (localhost:5000).
Every function raises on unexpected errors so the caller can decide
whether to retry, skip, or mark the document as failed.
"""

import requests
from config import DB_SERVICE_URL

# Shared session for connection reuse
_session = requests.Session()
_session.headers.update({"Content-Type": "application/json"})


def _url(path: str) -> str:
    return f"{DB_SERVICE_URL}{path}"


# ─────────────────────────────────────────────
# DOCUMENTS
# ─────────────────────────────────────────────

def check_hash_exists(hash_val: str) -> dict:
    """
    GET /db/documents/hash/{hash}
    Returns {"exists": bool, "doc_id": str | None}
    """
    resp = _session.get(_url(f"/db/documents/hash/{hash_val}"), timeout=10)
    resp.raise_for_status()
    return resp.json()


def insert_document(payload: dict) -> str:
    """
    POST /db/documents
    payload keys: doc_id, source_id, source_url, hash, full_text, published_at
    Returns doc_id string.
    """
    resp = _session.post(_url("/db/documents"), json=payload, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    if not data.get("success"):
        raise RuntimeError(f"DB rejected document insert: {data}")
    return data["doc_id"]


def update_document_status(doc_id: str, status: str) -> None:
    """
    PATCH /db/documents/{doc_id}/status
    status: 'ingesting' | 'processed' | 'failed' | 'duplicate'
    """
    resp = _session.patch(
        _url(f"/db/documents/{doc_id}/status"),
        json={"status": status},
        timeout=10,
    )
    resp.raise_for_status()


# ─────────────────────────────────────────────
# CONTEXT
# ─────────────────────────────────────────────

def insert_context(doc_id: str, summary: str, keywords: list[str]) -> None:
    """
    POST /db/documents/{doc_id}/context
    """
    resp = _session.post(
        _url(f"/db/documents/{doc_id}/context"),
        json={"summary": summary, "keywords": keywords},
        timeout=10,
    )
    resp.raise_for_status()


# ─────────────────────────────────────────────
# CLAUSES
# ─────────────────────────────────────────────

def insert_clauses(doc_id: str, clauses: list[dict]) -> int:
    """
    POST /db/documents/{doc_id}/clauses
    Each clause dict: clause_id, text, type, deadline, extraction_confidence
    Returns number of inserted rows.
    """
    resp = _session.post(
        _url(f"/db/documents/{doc_id}/clauses"),
        json={"clauses": clauses},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    if not data.get("success"):
        raise RuntimeError(f"DB rejected clauses insert: {data}")
    return data.get("inserted", len(clauses))

# ─────────────────────────────────────────────
# PIPELINE STATUS
# ─────────────────────────────────────────────

def create_pipeline_status(doc_id: str) -> None:
    """
    POST /db/pipeline-status
    """
    resp = _session.post(
        _url("/db/pipeline-status"),
        json={"doc_id": doc_id},
        timeout=10,
    )
    resp.raise_for_status()


def update_pipeline_status(doc_id: str, pipeline: str, status: str) -> None:
    """
    PATCH /db/pipeline-status/{doc_id}
    """
    resp = _session.patch(
        _url(f"/db/pipeline-status/{doc_id}"),
        json={"pipeline": pipeline, "status": status},
        timeout=10,
    )
    resp.raise_for_status()