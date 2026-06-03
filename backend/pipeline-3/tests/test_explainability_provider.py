import os
import sys
import unittest
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from explainability_provider import build_explainability_payload


class ExplainabilityProviderTests(unittest.TestCase):
    def setUp(self):
        self._old_enable = os.getenv("P3_ENABLE_SHAP")
        self._old_model = os.getenv("P3_SHAP_MODEL")

    def tearDown(self):
        if self._old_enable is None:
            os.environ.pop("P3_ENABLE_SHAP", None)
        else:
            os.environ["P3_ENABLE_SHAP"] = self._old_enable

        if self._old_model is None:
            os.environ.pop("P3_SHAP_MODEL", None)
        else:
            os.environ["P3_SHAP_MODEL"] = self._old_model

    def test_hybrid_payload_contains_stable_contract(self):
        os.environ["P3_ENABLE_SHAP"] = "false"

        clauses = [
            {
                "clause_id": "doc_1:c1",
                "text": "Maintain reserve ratio by month-end.",
                "deadline": "2026-12-31",
                "gap_detected": True,
                "mapping_confidence": 0.91,
                "mapped_policy": "Liquidity Policy",
                "department": "Risk",
                "reasoning": "Policy does not mention reserve ratio threshold.",
            }
        ]
        clause_scores = [
            {
                "clause_id": "doc_1:c1",
                "score": 0.83,
                "severity": 0.9,
                "impact": 0.9,
                "urgency": 0.5,
                "priority": "high",
            }
        ]

        payload = build_explainability_payload(
            doc_id="doc_1",
            clauses=clauses,
            clause_scores=clause_scores,
            doc_score=0.83,
            doc_priority="high",
            avg_breakdown={"severity": 0.9, "impact": 0.9, "urgency": 0.5},
            actions=[{"clause_id": "doc_1:c1", "action_text": "Update policy."}],
        )

        self.assertEqual(payload["schema_version"], "1.0")
        self.assertEqual(payload["mode"], "hybrid")
        self.assertIn("summary", payload)
        self.assertIn("deterministic", payload)
        self.assertIn("shap", payload)
        self.assertIn("actions", payload)
        self.assertFalse(payload["shap"]["available"])
        self.assertGreaterEqual(payload["summary"]["gap_clauses"], 1)

    def test_hybrid_payload_populates_shap_when_enabled(self):
        required = ["numpy", "sklearn", "shap"]
        if any(importlib.util.find_spec(name) is None for name in required):
            self.skipTest("Optional SHAP dependencies are not installed in this runtime.")

        os.environ["P3_ENABLE_SHAP"] = "true"
        os.environ["P3_SHAP_MODEL"] = "rf_surrogate"

        clauses = [
            {
                "clause_id": "doc_2:c1",
                "text": "Submit report every quarter.",
                "deadline": "2026-08-01",
                "gap_detected": True,
                "mapping_confidence": 0.9,
                "mapped_policy": "Reporting Policy",
                "department": "Compliance",
                "reasoning": "Reporting cadence missing.",
            },
            {
                "clause_id": "doc_2:c2",
                "text": "Store audit logs for seven years.",
                "deadline": "2027-06-01",
                "gap_detected": False,
                "mapping_confidence": 0.78,
                "mapped_policy": "Audit Policy",
                "department": "IT",
                "reasoning": "Policy partially covers retention.",
            },
        ]
        clause_scores = [
            {"clause_id": "doc_2:c1", "score": 0.82, "severity": 0.9, "impact": 0.9, "urgency": 0.5, "priority": "high"},
            {"clause_id": "doc_2:c2", "score": 0.38, "severity": 0.2, "impact": 0.3, "urgency": 0.7, "priority": "medium"},
        ]

        payload = build_explainability_payload(
            doc_id="doc_2",
            clauses=clauses,
            clause_scores=clause_scores,
            doc_score=0.82,
            doc_priority="high",
            avg_breakdown={"severity": 0.55, "impact": 0.6, "urgency": 0.6},
            actions=[],
        )

        self.assertTrue(payload["shap"]["available"])
        self.assertGreater(len(payload["shap"]["global_importance"]), 0)
        self.assertEqual(len(payload["shap"]["clause_values"]), len(clauses))


if __name__ == "__main__":
    unittest.main()

