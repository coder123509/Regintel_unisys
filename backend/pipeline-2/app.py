import os
import time
import asyncio
import logging
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

from services import MappingService
from mapping_engine import analyze_batch_with_llm
from db_client import (
    get_document,
    get_clauses,
    insert_mapping_bulk,
    insert_mapping_summary,
    update_pipeline_status,
)

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [P2]  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("Pipeline2")

app = FastAPI(title="RegIntel Pipeline 2: RAG + Mapping Engine")

# ── Init Neo4j service ───────────────────────────────────────────────
_URI  = os.getenv("NEO4J_URI")
_AUTH = (os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD"))
mapping_service = MappingService(_URI, _AUTH)


# ── Helpers ─────────────────────────────────────────────────────────

def chunked(arr, size):
    for i in range(0, len(arr), size):
        yield arr[i:i+size]


def _fallback_mapping():
    return {
        "mapped_policy":      "Unresolved",
        "department":         "Unknown",
        "gap_detected":       True,
        "mapping_confidence": 0.0,
        "reasoning":          "LLM service unavailable after retries.",
    }


# ── Routes ──────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"module": "Pipeline 2", "status": "active"}


@app.get("/rag/map/{doc_id}")
async def map_document(doc_id: str):
    logger.info(f"━━━ Starting mapping for {doc_id} ━━━")

    try:
        get_document(doc_id)
        clauses = get_clauses(doc_id)
    except Exception as e:
        update_pipeline_status(doc_id, "p2", "failed")
        raise HTTPException(status_code=404, detail=str(e))

    if not clauses:
        update_pipeline_status(doc_id, "p2", "failed")
        raise HTTPException(status_code=422, detail="No clauses found")

    logger.info(f"Processing {len(clauses)} clauses")

    enriched_clauses = []
    db_mappings = []
    gaps_count = 0

    BATCH_SIZE = 4

    for batch in chunked(clauses, BATCH_SIZE):

        # ── Build contexts ──
        contexts = []
        for clause in batch:
            ctx = mapping_service.get_hybrid_context(
                clause["clause_id"],
                clause["text"]
            )
            contexts.append(ctx)

        # ── Batch LLM call with retry ──
        batch_results = None
        for attempt in range(3):
            batch_results = analyze_batch_with_llm(contexts)

            if batch_results:
                break

            wait = (attempt + 1) * 6
            logger.warning(f"Batch retry {attempt+1}/3 — waiting {wait}s")
            await asyncio.sleep(wait)

        # ── Process results ──
        for i, clause in enumerate(batch):
            clause_id = clause["clause_id"]
            context   = contexts[i]

            if batch_results and i < len(batch_results):
                mapping_data = batch_results[i]
            else:
                mapping_data = _fallback_mapping()

            if mapping_data.get("gap_detected"):
                gaps_count += 1

            enriched_clauses.append({
                **clause,
                "mapping_data": mapping_data
            })

            db_mappings.append({
                "clause_id":          clause_id,
                "mapped_policy":      mapping_data["mapped_policy"],
                "department":         mapping_data["department"],
                "gap_detected":       mapping_data["gap_detected"],
                "mapping_confidence": mapping_data["mapping_confidence"],
                "reasoning":          mapping_data["reasoning"],
                "graph_policies":     context["retrieval_sources"]["graph_policies"],
                "semantic_policies":  context["retrieval_sources"]["semantic_policies"],
                "mapping_status":     "completed" if batch_results else "failed",
            })

        # ── Rate limiting (CRITICAL) ──
        logger.info("Sleeping 12s to respect Gemini rate limits")
        await asyncio.sleep(12)

    # ── Write mappings ──
    try:
        insert_mapping_bulk(doc_id, db_mappings)
    except Exception as e:
        update_pipeline_status(doc_id, "p2", "failed")
        raise HTTPException(status_code=500, detail=str(e))

    try:
        insert_mapping_summary(
            doc_id=doc_id,
            total_clauses=len(clauses),
            mapped_clauses=len(clauses),
            total_gaps=gaps_count,
            status="completed",
        )
    except Exception:
        pass

    update_pipeline_status(doc_id, "p2", "completed")

    logger.info(f"✔ {doc_id} complete — gaps: {gaps_count}/{len(clauses)}")

    return {
        "doc_id": doc_id,
        "total_clauses": len(clauses),
        "gaps": gaps_count,
        "status": "completed"
    }


@app.get("/rag/map/{doc_id}/{clause_id}")
async def map_single_clause(doc_id: str, clause_id: str):
    try:
        clauses = get_clauses(doc_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

    target = next((c for c in clauses if c["clause_id"] == clause_id), None)

    if not target:
        raise HTTPException(status_code=404, detail="Clause not found")

    context = mapping_service.get_hybrid_context(
        clause_id,
        target["text"]
    )

    batch_result = analyze_batch_with_llm([context])

    if not batch_result:
        raise HTTPException(status_code=503, detail="LLM unavailable")

    md = batch_result[0]

    return {
        "clause_id": clause_id,
        "mapped_policy": md["mapped_policy"],
        "department": md["department"],
        "gap": md["gap_detected"],
        "confidence": md["mapping_confidence"],
        "reason": md["reasoning"],
        "retrieval_sources": context["retrieval_sources"],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)