import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

# Import modular components
from mock_pipeline2 import get_mock_pipeline2_data
from risk_engine import calculate_aggregate_risk
from action_generator import generate_actions

app = FastAPI(title="Pipeline 3: Risk Scoring & Action Generation")

# In-memory mock database per README constraint 9: "Data Storage"
DATA_STORE = {}

class AnalyzeInput(BaseModel):
    doc_id: str

@app.post("/risk/analyze")
def analyze_risk(payload: AnalyzeInput):
    doc_id = payload.doc_id

    # Placeholder: Fetch mapped clauses from Pipeline 2
    # Since we are NOT connecting pipelines yet, use mock block
    pipeline2_data = get_mock_pipeline2_data(doc_id)

    if "clauses" not in pipeline2_data:
        raise HTTPException(status_code=404, detail="No clauses found for document")

    # Risk Scoring Logic
    score, priority, breakdown = calculate_aggregate_risk(pipeline2_data["clauses"])

    # Save partial results to Data Storage
    if doc_id not in DATA_STORE:
        DATA_STORE[doc_id] = {"doc_id": doc_id, "timestamp": str(datetime.now())}

    DATA_STORE[doc_id].update({
        "risk_score": score,
        "priority": priority,
        "breakdown": breakdown,
        "high_risk_clauses": sum(1 for c in pipeline2_data["clauses"] if c.get("mapping_data", {}).get("gap_detected", False))
    })

    return {
        "doc_id": doc_id,
        "risk_score": score,
        "priority": priority,
        "breakdown": breakdown
    }

@app.post("/actions/generate")
def generate_actions_for_doc(payload: AnalyzeInput):
    doc_id = payload.doc_id

    # Placeholder: Fetch data from Pipeline 2
    pipeline2_data = get_mock_pipeline2_data(doc_id)
    clauses = pipeline2_data.get("clauses", [])

    if not clauses:
        raise HTTPException(status_code=404, detail="No clauses found for document")

    # Generate Actions via LLM
    actions = generate_actions(clauses)

    # Update state
    if doc_id not in DATA_STORE:
        DATA_STORE[doc_id] = {"doc_id": doc_id, "timestamp": str(datetime.now())}

    DATA_STORE[doc_id]["actions"] = actions

    return {
        "doc_id": doc_id,
        "actions": actions
    }

@app.get("/dashboard/{doc_id}")
def get_dashboard(doc_id: str):
    # Check if analyzed in datastore, else auto-analyze using mock data
    # to provide seamless dashboard output if accessed directly
    if doc_id not in DATA_STORE or "risk_score" not in DATA_STORE[doc_id]:
        pipeline2_data = get_mock_pipeline2_data(doc_id)
        score, priority, _ = calculate_aggregate_risk(pipeline2_data.get("clauses", []))
        high_risk_clauses = sum(1 for c in pipeline2_data.get("clauses", []) if c.get("mapping_data", {}).get("gap_detected", False))

        # Populate minimum state
        if doc_id not in DATA_STORE:
            DATA_STORE[doc_id] = {"doc_id": doc_id, "timestamp": str(datetime.now())}

        DATA_STORE[doc_id].update({
            "risk_score": score,
            "priority": priority,
            "high_risk_clauses": high_risk_clauses
        })

    store_item = DATA_STORE[doc_id]
    actions = store_item.get("actions", [])

    return {
        "doc_id": doc_id,
        "risk_score": store_item.get("risk_score"),
        "priority": store_item.get("priority"),
        "actions_count": len(actions),
        "high_risk_clauses": store_item.get("high_risk_clauses", 0)
    }

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8003, reload=True)
