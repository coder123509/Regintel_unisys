from fastapi import FastAPI, HTTPException
import requests 
import os
import time
import logging
from typing import Dict, Any
from dotenv import load_dotenv

from services import MappingService
from mapping_logic import analyze_mapping_with_llm

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RegIntel-App")

load_dotenv()
app = FastAPI(title="RegIntel Pipeline 2: RAG + Knowledge Graph + Mapping Engine")

PIPELINE_1_URL = os.getenv("PIPELINE_1_URL", "http://localhost:8001")
URI = os.getenv("NEO4J_URI")
AUTH = (os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD"))

# Initialize Service Instance
mapping_service = MappingService(URI, AUTH)

def call_llm_with_retry(context, max_retries=2):
    """
    Helper to handle transient LLM errors (503/429) 
    without crashing the whole document process.
    """
    for attempt in range(max_retries):
        try:
            result = analyze_mapping_with_llm(context)
            # Check if our logic returned an error inside the object
            if "error" in result:
                raise Exception(result["details"])
            return result
        except Exception as e:
            wait = (attempt + 1) * 5  # 5s, 10s, 15s
            logger.warning(f"⚠️ LLM Error: {e}. Retrying in {wait}s... ({attempt+1}/{max_retries})")
            if attempt < max_retries - 1:
                time.sleep(wait)
            else:
                logger.error("❌ Max retries reached for LLM mapping.")
                return None

@app.get("/")
def read_root():
    return {"module": "Pipeline 2: RAG mapping engine", "status": "active"}

@app.get("/rag/map/{doc_id}")
async def get_mapped_document(doc_id: str):
    try:
        # 1. Fetch from Pipeline 1
        response = requests.get(f"{PIPELINE_1_URL}/documents/{doc_id}")
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Document not found in Pipeline 1")
        
        doc_data = response.json()
        clauses = doc_data.get("clauses", [])
        
        enriched_clauses = []
        gaps_count = 0

        # 2. Process clauses
        for clause in clauses:
            # Fix: Using the instance 'mapping_service'
            context = mapping_service.get_hybrid_context(
                clause_id=clause['clause_id'], 
                clause_text=clause['text']
            )

            # Step B: LLM Reasoning with Retry Logic
            mapping_result = call_llm_with_retry(context)
            
            if not mapping_result:
                # Fallback structure if LLM is totally dead
                mapping_data = {
                    "mapped_policy": "Service Unavailable",
                    "department": "N/A",
                    "gap_detected": True,
                    "mapping_confidence": 0,
                    "reasoning": "Failed to reach Gemini after multiple retries."
                }
            else:
                mapping_data = mapping_result["mapping_data"]

            enriched_clause = {
                **clause,
                "mapping_data": mapping_data
            }
            
            if mapping_data.get("gap_detected"):
                gaps_count += 1
                
            enriched_clauses.append(enriched_clause)
            
        return {
            "doc_id": doc_data["doc_id"],
            "source_id": doc_data["source_id"],
            "clauses": enriched_clauses,
            "mapping_summary": {
                "total_clauses": len(clauses),
                "total_gaps": gaps_count,
                "status": "completed"
            }
        }
    except Exception as e:
        logger.error(f"Pipeline 2 Critical Failure: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rag/map/{doc_id}/{clause_id}")
async def get_clause_deep_dive(doc_id: str, clause_id: str):
    try:
        resp = requests.get(f"{PIPELINE_1_URL}/documents/{doc_id}/clauses")
        if resp.status_code != 200:
             raise HTTPException(status_code=404, detail="Document clauses not found")
             
        clauses = resp.json()
        target_clause = next((c for c in clauses if c['clause_id'] == clause_id), None)
        
        if not target_clause:
            raise HTTPException(status_code=404, detail="Clause ID not found")

        context = mapping_service.get_hybrid_context(clause_id, target_clause['text'])
        mapping_result = call_llm_with_retry(context)

        if not mapping_result:
            raise HTTPException(status_code=503, detail="LLM reasoning service unavailable")

        return {
            "clause_id": clause_id,
            "doc_id": doc_id,
            "text": target_clause['text'],
            "type": target_clause.get('type'),
            "deadline": target_clause.get('deadline'),
            "mapped_policy": mapping_result["mapping_data"]["mapped_policy"],
            "department": mapping_result["mapping_data"]["department"],
            "gap": mapping_result["mapping_data"]["gap_detected"],
            "mapping_confidence": mapping_result["mapping_data"]["mapping_confidence"],
            "reason": mapping_result["mapping_data"]["reasoning"],
            "retrieval_sources": context["retrieval_sources"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)