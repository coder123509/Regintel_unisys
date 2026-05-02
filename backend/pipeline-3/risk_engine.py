from datetime import datetime

def calculate_clause_risk(clause):
    """
    Calculates the risk score for a single clause based on severity, impact, and urgency.
    """
    mapping_data = clause.get("mapping_data", {})
    gap = mapping_data.get("gap_detected", False)

    # 1. Severity (Importance/Regulatory impact)
    # High severity if there's a compliance gap
    severity = 0.9 if gap else 0.2

    # 2. Impact (Affected systems / operations)
    # Modulated by confident vs unconfident mappings
    confidence = mapping_data.get("mapping_confidence", 1.0)
    # If gap is real = high impact, if gap but low confidence = med impact
    if gap:
        impact = 0.9 if confidence > 0.8 else 0.6
    else:
        impact = 0.3

    # 3. Urgency (Deadline proximity)
    deadline = clause.get("deadline")
    urgency = 0.5
    if deadline:
        try:
            deadline_date = datetime.strptime(deadline, "%Y-%m-%d")
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
            pass # fallback to 0.5

    # Formula per README
    score = (0.4 * severity) + (0.3 * impact) + (0.3 * urgency)

    return {
        "clause_id": clause.get("clause_id"),
        "severity": severity,
        "impact": impact,
        "urgency": urgency,
        "score": score
    }

def calculate_aggregate_risk(clauses):
    """
    Calculates the aggregated risk score for a full document.
    """
    if not clauses:
        return 0.0, "low", {"severity": 0, "impact": 0, "urgency": 0}

    total_severity = 0.0
    total_impact = 0.0
    total_urgency = 0.0
    max_score = 0.0

    for c in clauses:
        risk = calculate_clause_risk(c)
        total_severity += risk["severity"]
        total_impact += risk["impact"]
        total_urgency += risk["urgency"]
        # In risk assessment, the highest risk clause often defines the overall document risk
        max_score = max(max_score, risk["score"])

    n = len(clauses)
    avg_breakdown = {
        "severity": round(total_severity / n, 2),
        "impact": round(total_impact / n, 2),
        "urgency": round(total_urgency / n, 2)
    }

    final_score = round(max_score, 2)

    if final_score < 0.3:
        priority = "low"
    elif final_score < 0.7:
        priority = "medium"
    else:
        priority = "high"

    return final_score, priority, avg_breakdown
