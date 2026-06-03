"""
ml_risk_adapter.py
──────────────────
Trains a lightweight surrogate ML model for clause risk and computes SHAP values.

The adapter uses current rule-engine outputs as training labels so SHAP values are
available now, while remaining compatible with a future learned risk model.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

import numpy as np
from sklearn.ensemble import RandomForestRegressor


FEATURE_NAMES = [
    "gap_detected",
    "mapping_confidence",
    "days_left_capped",
    "deadline_missing",
    "is_overdue",
    "text_length_norm",
]


def _parse_days_left(deadline: Optional[str]) -> Optional[int]:
    if not deadline:
        return None
    try:
        date_obj = datetime.strptime(str(deadline)[:10], "%Y-%m-%d")
        return (date_obj - datetime.now()).days
    except Exception:
        return None


def _clamp(v: float, lo: float, hi: float) -> float:
    return float(max(lo, min(hi, v)))


def _score_rule(gap: float, confidence: float, days_left: Optional[int]) -> float:
    severity = 0.9 if gap >= 0.5 else 0.2
    if gap >= 0.5:
        impact = 0.9 if confidence > 0.8 else 0.6
    else:
        impact = 0.3

    if days_left is None:
        urgency = 0.5
    elif days_left < 30:
        urgency = 0.9
    elif days_left < 90:
        urgency = 0.7
    elif days_left < 180:
        urgency = 0.5
    else:
        urgency = 0.2

    return round((0.4 * severity) + (0.3 * impact) + (0.3 * urgency), 3)


def _extract_features(clause: dict) -> np.ndarray:
    gap = 1.0 if clause.get("gap_detected", False) else 0.0
    confidence = _clamp(float(clause.get("mapping_confidence", 0.0)), 0.0, 1.0)
    days_left = _parse_days_left(clause.get("deadline"))

    if days_left is None:
        days_left_capped = 120.0
        deadline_missing = 1.0
        is_overdue = 0.0
    else:
        days_left_capped = _clamp(float(days_left), -30.0, 365.0)
        deadline_missing = 0.0
        is_overdue = 1.0 if days_left < 0 else 0.0

    text = str(clause.get("text", "") or "")
    text_length_norm = _clamp(len(text) / 1200.0, 0.0, 1.0)

    return np.array(
        [
            gap,
            confidence,
            days_left_capped,
            deadline_missing,
            is_overdue,
            text_length_norm,
        ],
        dtype=float,
    )


def _build_label_map(clauses: list[dict], clause_scores: list[dict]) -> dict:
    score_by_id = {c.get("clause_id"): c for c in clause_scores}
    labels = {}
    for clause in clauses:
        cid = clause.get("clause_id")
        score_row = score_by_id.get(cid)
        if score_row is not None and score_row.get("score") is not None:
            labels[cid] = float(score_row["score"])
            continue

        gap = 1.0 if clause.get("gap_detected", False) else 0.0
        conf = _clamp(float(clause.get("mapping_confidence", 0.0)), 0.0, 1.0)
        labels[cid] = _score_rule(gap, conf, _parse_days_left(clause.get("deadline")))
    return labels


def _build_augmented_training_set(clauses: list[dict], labels: dict, seed: int = 42) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)

    X_base = np.array([_extract_features(c) for c in clauses], dtype=float)
    y_base = np.array([labels.get(c.get("clause_id"), 0.0) for c in clauses], dtype=float)

    if len(clauses) == 0:
        return np.zeros((0, len(FEATURE_NAMES))), np.zeros((0,))

    # Augment with synthetic rows so the surrogate can generalize and produce stable SHAP values.
    synth_count = max(120, len(clauses) * 30)
    synth_rows = []
    synth_labels = []

    for _ in range(synth_count):
        source = clauses[rng.integers(0, len(clauses))]

        gap = 1.0 if rng.random() < (0.7 if source.get("gap_detected") else 0.3) else 0.0
        conf = _clamp(float(source.get("mapping_confidence", 0.5)) + rng.normal(0, 0.15), 0.0, 1.0)

        source_days = _parse_days_left(source.get("deadline"))
        if source_days is None and rng.random() < 0.4:
            days = None
        else:
            center = source_days if source_days is not None else 120
            days = int(_clamp(center + rng.normal(0, 80), -30, 365))

        text_len_norm = _clamp(len(str(source.get("text", ""))) / 1200.0 + rng.normal(0, 0.12), 0.0, 1.0)

        row = np.array(
            [
                gap,
                conf,
                float(120 if days is None else _clamp(days, -30.0, 365.0)),
                1.0 if days is None else 0.0,
                1.0 if (days is not None and days < 0) else 0.0,
                text_len_norm,
            ],
            dtype=float,
        )
        synth_rows.append(row)
        synth_labels.append(_score_rule(gap, conf, days))

    X = np.vstack([X_base, np.array(synth_rows, dtype=float)])
    y = np.concatenate([y_base, np.array(synth_labels, dtype=float)])
    return X, y


def _to_clause_values(
    clauses: list[dict],
    X_eval: np.ndarray,
    predictions: np.ndarray,
    shap_values: np.ndarray,
    labels: dict,
) -> list[dict]:
    clause_values = []

    for idx, clause in enumerate(clauses):
        cid = clause.get("clause_id")
        contribs = []
        for f_idx, name in enumerate(FEATURE_NAMES):
            contribs.append(
                {
                    "feature": name,
                    "value": float(X_eval[idx, f_idx]),
                    "shap_value": float(shap_values[idx, f_idx]),
                    "abs_shap": float(abs(shap_values[idx, f_idx])),
                }
            )
        contribs.sort(key=lambda item: item["abs_shap"], reverse=True)

        clause_values.append(
            {
                "clause_id": cid,
                "predicted_score": float(round(predictions[idx], 4)),
                "reference_score": float(round(labels.get(cid, 0.0), 4)),
                "top_driver": contribs[0]["feature"] if contribs else None,
                "feature_contributions": contribs,
            }
        )

    return clause_values


def build_ml_shap_payload(
    doc_id: str,
    clauses: list[dict],
    clause_scores: list[dict],
    model_name: str = "rf_surrogate",
) -> dict:
    """Fit a surrogate model and return global + per-clause SHAP explanations."""
    if not clauses:
        return {
            "available": False,
            "reason": "No clauses available to train or explain.",
            "model": model_name,
            "base_value": None,
            "global_importance": [],
            "clause_values": [],
        }

    labels = _build_label_map(clauses, clause_scores)
    X_train, y_train = _build_augmented_training_set(clauses, labels)
    X_eval = np.array([_extract_features(c) for c in clauses], dtype=float)

    if X_train.shape[0] < 20:
        return {
            "available": False,
            "reason": "Insufficient training rows for SHAP surrogate fitting.",
            "model": model_name,
            "base_value": None,
            "global_importance": [],
            "clause_values": [],
        }

    model = RandomForestRegressor(
        n_estimators=160,
        max_depth=6,
        min_samples_leaf=2,
        random_state=42,
    )
    model.fit(X_train, y_train)

    import shap  # lazy import; only required for SHAP-enabled path

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_eval)

    if isinstance(shap_values, list):
        shap_values = shap_values[0]

    shap_values = np.array(shap_values, dtype=float)
    predictions = model.predict(X_eval)

    expected = explainer.expected_value
    if isinstance(expected, np.ndarray):
        base_value = float(expected.reshape(-1)[0])
    else:
        base_value = float(expected)

    mean_abs = np.mean(np.abs(shap_values), axis=0)
    global_importance = [
        {
            "feature": FEATURE_NAMES[idx],
            "importance": float(round(mean_abs[idx], 6)),
        }
        for idx in range(len(FEATURE_NAMES))
    ]
    global_importance.sort(key=lambda item: item["importance"], reverse=True)

    clause_values = _to_clause_values(
        clauses=clauses,
        X_eval=X_eval,
        predictions=predictions,
        shap_values=shap_values,
        labels=labels,
    )

    return {
        "available": True,
        "reason": None,
        "model": model_name,
        "base_value": float(round(base_value, 6)),
        "global_importance": global_importance,
        "clause_values": clause_values,
        "meta": {
            "doc_id": doc_id,
            "feature_names": FEATURE_NAMES,
            "training_rows": int(X_train.shape[0]),
        },
    }

