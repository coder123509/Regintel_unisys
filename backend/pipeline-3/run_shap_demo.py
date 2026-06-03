"""Tiny runner to inspect hybrid explainability output with SHAP enabled."""

import json
import os

from explainability_provider import build_explainability_payload


if __name__ == "__main__":
    os.environ.setdefault("P3_ENABLE_SHAP", "true")
    os.environ.setdefault("P3_SHAP_MODEL", "rf_surrogate")

    clauses = [
        {
            "clause_id": "demo:c1",
            "text": "Maintain minimum capital adequacy ratio and report monthly.",
            "deadline": "2026-07-15",
            "gap_detected": True,
            "mapping_confidence": 0.92,
            "mapped_policy": "Capital Policy",
            "department": "Risk",
            "reasoning": "No monthly reporting control found.",
        },
        {
            "clause_id": "demo:c2",
            "text": "Encrypt customer PII in transit and at rest.",
            "deadline": "2026-12-01",
            "gap_detected": False,
            "mapping_confidence": 0.86,
            "mapped_policy": "Data Protection Policy",
            "department": "Security",
            "reasoning": "Control exists but needs periodic review.",
        },
    ]

    clause_scores = [
        {"clause_id": "demo:c1", "score": 0.84, "severity": 0.9, "impact": 0.9, "urgency": 0.5, "priority": "high"},
        {"clause_id": "demo:c2", "score": 0.41, "severity": 0.2, "impact": 0.3, "urgency": 0.9, "priority": "medium"},
    ]

    payload = build_explainability_payload(
        doc_id="demo",
        clauses=clauses,
        clause_scores=clause_scores,
        doc_score=0.84,
        doc_priority="high",
        avg_breakdown={"severity": 0.55, "impact": 0.6, "urgency": 0.7},
        actions=[],
    )

    print(json.dumps(payload.get("shap", {}), indent=2))

