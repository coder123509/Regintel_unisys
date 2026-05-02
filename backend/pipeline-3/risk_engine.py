"""
risk_engine.py
──────────────
Risk scoring logic.
Works on merged clause data (mapping + raw clause for deadline).
"""

from datetime import datetime


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
    gap        = clause.get("gap_detected", False)
    confidence = float(clause.get("mapping_confidence", 1.0))

    # 1. Severity — regulatory importance
    severity = 0.9 if gap else 0.2

    # 2. Impact — affected systems / operations
    if gap:
        impact = 0.9 if confidence > 0.8 else 0.6
    else:
        impact = 0.3

    # 3. Urgency — deadline proximity
    urgency  = 0.5
    deadline = clause.get("deadline")
    if deadline:
        try:
            deadline_date = datetime.strptime(str(deadline)[:10], "%Y-%m-%d")
            days_left = (deadline_date - datetime.now()).days
            if days_left < 30:
                urgency = 0.9
            elif days_left < 90:
                urgency = 0.7
            elif days_left < 180:
                urgency = 0.5
            else:
                urgency = 0.2
        except Exception:
            pass

    score = round((0.4 * severity) + (0.3 * impact) + (0.3 * urgency), 3)

    return {
        "clause_id": clause.get("clause_id"),
        "severity":  round(severity, 3),
        "impact":    round(impact, 3),
        "urgency":   round(urgency, 3),
        "score":     score,
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