"""
action_generator.py
────────────────────
Generates actionable recommendations using Gemini.
Produces clause-level actions (not just doc-level) so each
action can be linked back to a specific clause_id in the DB.
"""

import os
import json
import logging
from google import genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("ActionGenerator")

_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

VALID_ACTION_TYPES = {"policy_update", "alert", "audit", "checklist"}

PROMPT_TEMPLATE = """
You are a senior banking compliance officer.

Given the following regulatory clauses with detected compliance gaps,
generate specific actionable recommendations.

For each gap clause, produce ONE action object.
Return ONLY a valid JSON array. No explanation, no markdown.

Each object must have:
- "clause_id": the clause_id from input
- "action_text": clear, specific action to take (1-2 sentences)
- "action_type": one of "policy_update", "alert", "audit", "checklist"
- "department": the department responsible

GAP CLAUSES:
{gap_clauses_json}

Return ONLY the JSON array:
"""


def generate_actions(clauses: list[dict]) -> list[dict]:
    """
    Takes a list of merged clause dicts (mapping + raw clause data).
    Returns a list of action dicts ready for DB insert:
      clause_id, action_text, action_type, department

    Falls back to rule-based actions if Gemini fails.
    """
    # Filter to only gap clauses
    gap_clauses = [
        {
            "clause_id":    c["clause_id"],
            "text":         c.get("text", ""),
            "department":   c.get("department", "Unknown"),
            "mapped_policy": c.get("mapped_policy", ""),
            "reasoning":    c.get("reasoning", ""),
        }
        for c in clauses
        if c.get("gap_detected")
    ]

    if not gap_clauses:
        return []

    # Try Gemini
    try:
        prompt = PROMPT_TEMPLATE.format(
            gap_clauses_json=json.dumps(gap_clauses, indent=2)
        )
        response = _client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "temperature": 0.2,
            },
        )
        actions = json.loads(response.text)

        if not isinstance(actions, list):
            raise ValueError("Response is not a list")

        # Validate and normalise each action
        validated = []
        for a in actions:
            action_type = a.get("action_type", "alert")
            if action_type not in VALID_ACTION_TYPES:
                action_type = "alert"
            validated.append({
                "clause_id":   a.get("clause_id"),
                "action_text": a.get("action_text", "Review and remediate gap."),
                "action_type": action_type,
                "department":  a.get("department", "Compliance"),
            })
        return validated

    except Exception as e:
        logger.error(f"Gemini action generation failed: {e} — using fallback")
        return _fallback_actions(gap_clauses)


def _fallback_actions(gap_clauses: list[dict]) -> list[dict]:
    """Rule-based fallback when Gemini is unavailable."""
    actions = []
    for c in gap_clauses:
        actions.append({
            "clause_id":   c["clause_id"],
            "action_text": f"Review and update {c.get('mapped_policy', 'relevant policy')} "
                           f"to address gap: {c.get('reasoning', 'compliance gap detected')}",
            "action_type": "policy_update",
            "department":  c.get("department", "Compliance"),
        })
    return actions