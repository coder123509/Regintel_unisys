"""
storage.py
----------
Writes a fully processed document to the DB microservice.
Exact endpoint spec:

  1. POST /db/documents
  2. POST /db/documents/{doc_id}/context
  3. POST /db/documents/{doc_id}/clauses
  4. PATCH /db/documents/{doc_id}/status  (mark processed)
"""

import uuid
from datetime import datetime, timezone

from db_client import insert_document, insert_context, insert_clauses, update_document_status


def _make_doc_id() -> str:
    return "doc_" + str(uuid.uuid4())[:8]


def _make_source_id(url: str, hash_val: str) -> str:
    """
    source_id must be UNIQUE per document.
    Derived from URL filename + first 8 chars of hash.
    e.g. "rbi_NT60A82D07_ab12cd34"
    """
    filename = url.split("/")[-1].split(".")[0][:20]
    return f"rbi_{filename}_{hash_val[:8]}"


def store_document(data: dict) -> str:
    """
    data = {
        "url":     str,
        "text":    str,
        "hash":    str,
        "clauses": list[dict],
        "context": dict,
    }
    Returns doc_id string on success. Raises on any DB error.
    """
    doc_id    = _make_doc_id()
    source_id = _make_source_id(data["url"], data["hash"])
    now       = datetime.now(timezone.utc).isoformat()

    # ── 1. POST /db/documents ───────────────────────────────────────────────
    insert_document({
        "doc_id":       doc_id,
        "source_id":    source_id,
        "source_url":   data["url"],
        "hash":         data["hash"],
        "full_text":    data["text"],
        "published_at": now,
    })
    print(f"  ✔ Document row inserted — doc_id: {doc_id}, source_id: {source_id}")

    # ── 2. POST /db/documents/{doc_id}/context ──────────────────────────────
    ctx = data["context"]
    insert_context(
        doc_id,
        summary=ctx.get("summary", ""),
        keywords=ctx.get("keywords", []),
    )
    print(f"  ✔ Context inserted")

    # ── 3. POST /db/documents/{doc_id}/clauses ──────────────────────────────
    # Strip embeddings — Postgres schema has no embedding column.
    # Embeddings stay on the in-memory clause objects for Pipeline 2.
    clauses_for_db = []
    for i, clause in enumerate(data["clauses"]):
        clauses_for_db.append({
            "clause_id":             f"{doc_id}:c{i}",
            "text":                  clause["text"],
            "type":                  clause["type"],
            "deadline":              clause.get("deadline"),
            "extraction_confidence": clause["confidence"],
        })

    if clauses_for_db:
        inserted = insert_clauses(doc_id, clauses_for_db)
        print(f"  ✔ Clauses inserted: {inserted}")
    else:
        print(f"  ⚠ No clauses to insert")

    # ── 4. PATCH /db/documents/{doc_id}/status → processed ─────────────────
    update_document_status(doc_id, "processed")
    print(f"  ✔ Status set to 'processed'")

    return doc_id