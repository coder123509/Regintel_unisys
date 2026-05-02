"""
app.py
──────
Pipeline 3: Risk Scoring + Action Generation
FastAPI service running on port 8003.

Flow per document (triggered by controller):
  1. Read clause mappings from DB microservice (written by P2)
  2. Read raw clauses for deadline data
  3. Merge mapping + clause data
  4. Score risk per clause + aggregate doc-level score
  5. Generate actions for gap clauses via Gemini
  6. Write clause-level risk scores to DB
  7. Write doc-level risk score to DB
  8. Write actions to DB
  9. Update pipeline_status: p3 → completed | failed
"""

import logging
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv

from risk_engine import calculate_aggregate_risk
from action_generator import generate_actions
from db_client import (
    get_clause_mappings,
    get_clauses,
    insert_risk,
    insert_actions_bulk,
    update_pipeline_status,
)

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [P3]  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("Pipeline3")

app = FastAPI(title="RegIntel Pipeline 3: Risk Scoring + Action Generation")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _merge_clause_data(mappings: list[dict], raw_clauses: list[dict]) -> list[dict]:
    raw_by_id = {c["clause_id"]: c for c in raw_clauses}
    merged = []
    for m in mappings:
        raw = raw_by_id.get(m["clause_id"], {})
        merged.append({
            "clause_id":          m["clause_id"],
            "text":               raw.get("text", ""),
            "deadline":           raw.get("deadline"),
            "gap_detected":       m.get("gap_detected", False),
            "mapping_confidence": float(m.get("mapping_confidence", 0.0)),  # cast
            "mapped_policy":      m.get("mapped_policy", ""),
            "department":         m.get("department", "Unknown"),
            "reasoning":          m.get("reasoning", ""),
        })
    return merged


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"module": "Pipeline 3: Risk Scoring + Action Generation", "status": "active"}


@app.post("/risk/analyze/{doc_id}")
async def analyze_document(doc_id: str):
    """
    Main endpoint — triggered by the controller.
    Reads P2 output, scores risk, generates actions, writes everything to DB.
    """
    logger.info(f"━━━ Starting risk analysis for {doc_id} ━━━")

    # ── 1. Fetch data from DB ─────────────────────────────────────────────
    try:
        mappings    = get_clause_mappings(doc_id)
        raw_clauses = get_clauses(doc_id)
    except Exception as e:
        logger.error(f"Failed to fetch data for {doc_id}: {e}")
        update_pipeline_status(doc_id, "p3", "failed")
        raise HTTPException(status_code=404, detail=str(e))

    if not mappings:
        logger.warning(f"No mappings found for {doc_id}")
        update_pipeline_status(doc_id, "p3", "failed")
        raise HTTPException(status_code=422, detail="No clause mappings found — run P2 first")

    # ── 2. Merge mapping + raw clause data ────────────────────────────────
    clauses = _merge_clause_data(mappings, raw_clauses)
    logger.info(f"Scoring {len(clauses)} clauses")

    # ── 3. Risk scoring ───────────────────────────────────────────────────
    doc_score, doc_priority, avg_breakdown, clause_scores = calculate_aggregate_risk(clauses)

    # ── 4. Write clause-level risk scores to DB ───────────────────────────
    clause_score_by_id = {cs["clause_id"]: cs for cs in clause_scores}
    for clause in clauses:
        cs = clause_score_by_id.get(clause["clause_id"], {})
        try:
            insert_risk(
                doc_id     = doc_id,
                clause_id  = clause["clause_id"],
                risk_score = cs.get("score", 0.0),
                severity   = cs.get("severity", 0.0),
                impact     = cs.get("impact", 0.0),
                urgency    = cs.get("urgency", 0.0),
                priority   = cs.get("priority", "low"),
            )
        except Exception as e:
            logger.warning(f"Failed to write clause risk for {clause['clause_id']}: {e}")

    # ── 5. Write doc-level risk score to DB ──────────────────────────────
    try:
        insert_risk(
            doc_id     = doc_id,
            clause_id  = None,
            risk_score = doc_score,
            severity   = avg_breakdown["severity"],
            impact     = avg_breakdown["impact"],
            urgency    = avg_breakdown["urgency"],
            priority   = doc_priority,
        )
        logger.info(f"Doc risk written — score: {doc_score}, priority: {doc_priority}")
    except Exception as e:
        logger.error(f"Failed to write doc risk for {doc_id}: {e}")
        update_pipeline_status(doc_id, "p3", "failed")
        raise HTTPException(status_code=500, detail=f"Risk DB write failed: {e}")

    # ── 6. Generate actions for gap clauses ───────────────────────────────
    actions = generate_actions(clauses)
    logger.info(f"Generated {len(actions)} actions for {doc_id}")

    # ── 7. Write actions to DB ────────────────────────────────────────────
    if actions:
        try:
            inserted = insert_actions_bulk(doc_id, actions)
            logger.info(f"Wrote {inserted} actions for {doc_id}")
        except Exception as e:
            logger.error(f"Failed to write actions for {doc_id}: {e}")
            # Non-fatal — don't fail the whole pipeline

    # ── 8. Update pipeline status ─────────────────────────────────────────
    update_pipeline_status(doc_id, "p3", "completed")
    logger.info(f"✔ {doc_id} complete — risk: {doc_score} ({doc_priority}), actions: {len(actions)}")

    gaps = sum(1 for c in clauses if c.get("gap_detected"))

    return {
        "doc_id":      doc_id,
        "risk_score":  doc_score,
        "priority":    doc_priority,
        "breakdown":   avg_breakdown,
        "total_clauses": len(clauses),
        "gaps":        gaps,
        "actions":     len(actions),
        "status":      "completed",
    }


@app.get("/dashboard/{doc_id}")
async def get_dashboard(doc_id: str):
    """
    Read-only dashboard view — pulls from DB directly.
    Does not trigger any processing.
    """
    from db_client import _session, _url

    try:
        risk_resp = _session.get(_url(f"/db/risk/{doc_id}"), timeout=10)
        risk_resp.raise_for_status()
        risk_data = risk_resp.json()
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Risk data not found for {doc_id}: {e}")

    try:
        actions_resp = _session.get(_url(f"/db/actions/{doc_id}"), timeout=10)
        actions_resp.raise_for_status()
        actions = actions_resp.json()
    except Exception:
        actions = []

    try:
        clauses_resp = _session.get(_url(f"/db/risk/{doc_id}/clauses"), timeout=10)
        clauses_resp.raise_for_status()
        clause_risks = clauses_resp.json()
    except Exception:
        clause_risks = []

    high_risk = sum(1 for c in clause_risks if c.get("priority") == "high")

    return {
        "doc_id":          doc_id,
        "risk_score":      risk_data.get("risk_score"),
        "priority":        risk_data.get("priority"),
        "actions_count":   len(actions),
        "high_risk_clauses": high_risk,
        "scored_at":       risk_data.get("scored_at"),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)