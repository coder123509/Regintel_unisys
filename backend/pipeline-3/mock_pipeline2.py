def get_mock_pipeline2_data(doc_id: str):
    """
    Simulates the fetch from Pipeline 2 without directly connecting to it.
    Returns mocked structure conforming to Pipeline 2 output.
    """
    return {
      "doc_id": doc_id,
      "source_id": f"rbi_guideline_{doc_id}",
      "clauses": [
        {
          "clause_id": "c1",
          "text": "Banks must ensure robust data encryption at rest for customer PII.",
          "deadline": "2026-01-01",
          "mapping_data": {
             "mapped_policy": "Data Protection Policy",
             "department": "Security Team",
             "gap_detected": True,
             "mapping_confidence": 0.88,
             "reasoning": "Internal policies only cover encryption in transit, lacking rest encryption requirements."
          }
        },
        {
          "clause_id": "c2",
          "text": "Annual compliance audits must be submitted to the RBI board.",
          "deadline": "2024-12-01", # High urgency
          "mapping_data": {
             "mapped_policy": "Audit Compliance Policy",
             "department": "Compliance Team",
             "gap_detected": False,
             "mapping_confidence": 0.95,
             "reasoning": "The internal policy explicitly mandates annual audit submissions."
          }
        },
        {
          "clause_id": "c3",
          "text": "Incident response SLA must be within 4 hours.",
          "deadline": "2025-06-15",
          "mapping_data": {
             "mapped_policy": "Incident Management Protocol",
             "department": "IT Operations",
             "gap_detected": True,
             "mapping_confidence": 0.90,
             "reasoning": "Internal SLA specifies 24 hours, failing the 4 hour regulatory mandate."
          }
        }
      ],
      "mapping_summary": {
         "total_clauses": 3,
         "total_gaps": 2,
         "status": "completed"
      }
    }
