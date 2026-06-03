"""
explainability_provider.py
──────────────────────────
Hybrid explainability contract for Pipeline 3.

- Deterministic: always available for the current rule-based scorer.
- SHAP: schema-ready channel that can be enabled when an ML model is configured.
"""

import logging
import os

from risk_engine import explain_document_risk

logger = logging.getLogger("ExplainabilityProvider")


def _is_truthy(value: str) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _build_shap_payload(doc_id: str, clauses: list[dict], clause_scores: list[dict]) -> dict:
    enabled = _is_truthy(os.getenv("P3_ENABLE_SHAP", "true"))
    model_name = os.getenv("P3_SHAP_MODEL", "rf_surrogate")

    if not enabled:
        return {
            "available": False,
            "reason": "SHAP is disabled (set P3_ENABLE_SHAP=true to enable the ML adapter).",
            "model": model_name,
            "base_value": None,
            "global_importance": [],
            "clause_values": [],
        }

    try:
        from ml_risk_adapter import build_ml_shap_payload

        return build_ml_shap_payload(
            doc_id=doc_id,
            clauses=clauses,
            clause_scores=clause_scores,
            model_name=model_name,
        )
    except Exception as err:
        logger.warning("ML SHAP adapter failed: %s", err)
        return {
            "available": False,
            "reason": f"ML SHAP adapter failed: {err}",
            "model": model_name,
            "base_value": None,
            "global_importance": [],
            "clause_values": [],
        }


def build_explainability_payload(
    doc_id: str,
    clauses: list[dict],
    clause_scores: list[dict],
    doc_score: float,
    doc_priority: str,
    avg_breakdown: dict,
    actions=None,
) -> dict:
    """Return a stable hybrid explainability response consumed by API and UI."""
    deterministic = explain_document_risk(
        clauses=clauses,
        clause_scores=clause_scores,
        doc_score=doc_score,
        doc_priority=doc_priority,
        avg_breakdown=avg_breakdown,
        actions_count=len(actions or []),
    )

    shap_payload = _build_shap_payload(doc_id, clauses, clause_scores)

    return {
        "schema_version": "1.0",
        "doc_id": doc_id,
        "mode": "hybrid",
        "summary": deterministic,
        "deterministic": deterministic,
        "shap": shap_payload,
        "actions": actions or [],
    }

