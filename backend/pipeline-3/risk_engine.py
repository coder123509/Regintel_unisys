"""
risk_engine.py
──────────────
Risk scoring logic.
Works on merged clause data (mapping + raw clause for deadline).
"""

from datetime import datetime
from typing import Optional


def _deadline_context(deadline: Optional[str]) -> dict:
    """Return parsed deadline metadata used both for scoring and explanation."""
    context = {
        "deadline": deadline,
        "days_left": None,
        "bucket": "unknown",
        "urgency": 0.5,
        "label": "No deadline was supplied, so urgency defaults to a moderate level.",
    }

    if not deadline:
        return context

    try:
        deadline_date = datetime.strptime(str(deadline)[:10], "%Y-%m-%d")
        days_left = (deadline_date - datetime.now()).days

        if days_left < 30:
            bucket = "urgent"
            urgency = 0.9
            label = f"The deadline is {days_left} day(s) away, so urgency is high."
        elif days_left < 90:
            bucket = "near_term"
            urgency = 0.7
            label = f"The deadline is {days_left} day(s) away, so urgency is elevated."
        elif days_left < 180:
            bucket = "mid_term"
            urgency = 0.5
            label = f"The deadline is {days_left} day(s) away, so urgency stays moderate."
        else:
            bucket = "long_term"
            urgency = 0.2
            label = f"The deadline is {days_left} day(s) away, so urgency is low."

        context.update({
            "days_left": days_left,
            "bucket": bucket,
            "urgency": urgency,
            "label": label,
        })
    except Exception:
        context["label"] = "The deadline could not be parsed, so urgency falls back to a neutral value."

    return context


def _score_components(clause: dict) -> dict:
    gap = clause.get("gap_detected", False)
    confidence = float(clause.get("mapping_confidence", 1.0))
    deadline_context = _deadline_context(clause.get("deadline"))

    # 1. Severity — regulatory importance
    severity = 0.9 if gap else 0.2

    # 2. Impact — affected systems / operations
    if gap:
        impact = 0.9 if confidence > 0.8 else 0.6
    else:
        impact = 0.3

    # 3. Urgency — deadline proximity
    urgency = deadline_context["urgency"]

    return {
        "gap": gap,
        "confidence": confidence,
        "severity": severity,
        "impact": impact,
        "urgency": urgency,
        "deadline_context": deadline_context,
    }


def calculate_clause_risk(clause: dict) -> dict:
    """
    Scores a single clause.

    Input clause must have:
      - gap_detected       (bool)
      - mapping_confidence (float)
      - deadline           (str "YYYY-MM-DD" or None)
      - clause_id          (str)
      - department         (str)
    """
    components = _score_components(clause)
    severity = components["severity"]
    impact = components["impact"]
    urgency = components["urgency"]

    score = round((0.4 * severity) + (0.3 * impact) + (0.3 * urgency), 3)

    return {
        "clause_id": clause.get("clause_id"),
        "severity":  round(severity, 3),
        "impact":    round(impact, 3),
        "urgency":   round(urgency, 3),
        "score":     score,
    }


def explain_clause_risk(clause: dict, risk: Optional[dict] = None) -> dict:
    """Build a human-readable explanation for a single clause risk score."""
    risk = risk or calculate_clause_risk(clause)
    components = _score_components(clause)
    deadline_context = components["deadline_context"]
    gap = components["gap"]
    confidence = components["confidence"]

    factors = [
        {
            "name": "severity",
            "weight": 0.4,
            "value": round(components["severity"], 3),
            "contribution": round(components["severity"] * 0.4, 3),
            "reason": "A compliance gap was detected." if gap else "No compliance gap was detected.",
        },
        {
            "name": "impact",
            "weight": 0.3,
            "value": round(components["impact"], 3),
            "contribution": round(components["impact"] * 0.3, 3),
            "reason": (
                f"Mapping confidence is {confidence:.2f}, which makes the downstream impact "
                f"{'high' if components['impact'] >= 0.9 else 'elevated' if components['impact'] >= 0.6 else 'limited'}."
            ),
        },
        {
            "name": "urgency",
            "weight": 0.3,
            "value": round(components["urgency"], 3),
            "contribution": round(components["urgency"] * 0.3, 3),
            "reason": deadline_context["label"],
        },
    ]

    dominant_factor = max(factors, key=lambda item: item["contribution"])
    explanation_text = (
        f"Clause {clause.get('clause_id')} scored {risk['score']:.3f} ({risk.get('priority', _priority(risk['score']))}). "
        f"{factors[0]['reason']} {factors[1]['reason']} {factors[2]['reason']}"
    )

    return {
        "clause_id": clause.get("clause_id"),
        "risk_score": risk["score"],
        "priority": risk.get("priority", _priority(risk["score"])),
        "explanation": explanation_text,
        "dominant_factor": dominant_factor["name"],
        "factors": factors,
        "evidence": {
            "gap_detected": gap,
            "mapping_confidence": round(confidence, 3),
            "mapped_policy": clause.get("mapped_policy", ""),
            "department": clause.get("department", "Unknown"),
            "reasoning": clause.get("reasoning", ""),
            "deadline": deadline_context["deadline"],
            "deadline_bucket": deadline_context["bucket"],
            "days_left": deadline_context["days_left"],
        },
    }


def explain_document_risk(
    clauses: list[dict],
    clause_scores: list[dict],
    doc_score: float,
    doc_priority: str,
    avg_breakdown: dict,
    actions_count: int = 0,
) -> dict:
    """Summarise the document-level risk drivers for the dashboard and API responses."""
    if not clauses:
        return {
            "score_method": "max_clause_score",
            "summary": "No clauses were available for explanation.",
            "gap_clauses": 0,
            "highest_risk_clause": None,
            "average_breakdown": avg_breakdown,
            "actions_count": actions_count,
        }

    clause_explanations = []
    total_contributions = {"severity": 0.0, "impact": 0.0, "urgency": 0.0}
    gap_clauses = 0

    clause_score_by_id = {item["clause_id"]: item for item in clause_scores}

    for clause in clauses:
        score = clause_score_by_id.get(clause.get("clause_id"))
        explanation = explain_clause_risk(clause, score) if score else explain_clause_risk(clause)
        clause_explanations.append({
            **explanation,
            "text": clause.get("text", ""),
            "mapped_policy": clause.get("mapped_policy", ""),
            "gap_detected": clause.get("gap_detected", False),
        })

        if clause.get("gap_detected"):
            gap_clauses += 1

        total_contributions["severity"] += explanation["factors"][0]["contribution"]
        total_contributions["impact"] += explanation["factors"][1]["contribution"]
        total_contributions["urgency"] += explanation["factors"][2]["contribution"]

    n = len(clause_explanations)
    avg_contributions = {
        key: round(value / n, 3)
        for key, value in total_contributions.items()
    }
    dominant_factor = max(avg_contributions, key=avg_contributions.get)
    highest_risk_clause = max(clause_explanations, key=lambda item: item["risk_score"])

    summary = (
        f"Document priority is {doc_priority} with an overall score of {doc_score:.3f}. "
        f"The highest-risk clause is {highest_risk_clause['clause_id']} at {highest_risk_clause['risk_score']:.3f}. "
        f"{gap_clauses} of {n} clauses have compliance gaps, and {dominant_factor} is the strongest average risk driver."
    )

    return {
        "score_method": "max_clause_score",
        "summary": summary,
        "gap_clauses": gap_clauses,
        "total_clauses": n,
        "highest_risk_clause": {
            "clause_id": highest_risk_clause["clause_id"],
            "risk_score": highest_risk_clause["risk_score"],
            "priority": highest_risk_clause["priority"],
            "explanation": highest_risk_clause["explanation"],
        },
        "average_breakdown": avg_breakdown,
        "average_contributions": avg_contributions,
        "dominant_factor": dominant_factor,
        "clause_explanations": clause_explanations,
        "actions_count": actions_count,
    }


def _priority(score: float) -> str:
    if score < 0.3:
        return "low"
    elif score < 0.7:
        return "medium"
    return "high"


def calculate_aggregate_risk(clauses: list[dict]) -> tuple[float, str, dict, list[dict]]:
    """
    Calculates document-level and clause-level risk.

    Returns:
      (doc_score, doc_priority, avg_breakdown, clause_scores)

    clause_scores is a list of per-clause risk dicts including priority.
    """
    if not clauses:
        return 0.0, "low", {"severity": 0.0, "impact": 0.0, "urgency": 0.0}, []

    clause_scores = []
    total_severity = total_impact = total_urgency = 0.0
    max_score = 0.0

    for c in clauses:
        risk = calculate_clause_risk(c)
        risk["priority"] = _priority(risk["score"])
        clause_scores.append(risk)

        total_severity += risk["severity"]
        total_impact   += risk["impact"]
        total_urgency  += risk["urgency"]
        max_score = max(max_score, risk["score"])

    n = len(clauses)
    avg_breakdown = {
        "severity": round(total_severity / n, 3),
        "impact":   round(total_impact   / n, 3),
        "urgency":  round(total_urgency  / n, 3),
    }

    doc_score    = round(max_score, 3)
    doc_priority = _priority(doc_score)

    return doc_score, doc_priority, avg_breakdown, clause_scores