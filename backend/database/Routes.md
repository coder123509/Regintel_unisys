# RegIntel API Documentation

## ALL STATUS
```
CREATE TYPE document_status AS ENUM ('ingesting', 'processed', 'failed', 'duplicate');
CREATE TYPE clause_type AS ENUM ('obligation', 'prohibition', 'permission');
CREATE TYPE mapping_status AS ENUM ('pending', 'completed', 'failed', 'partial');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE action_type AS ENUM ('policy_update', 'alert', 'audit', 'checklist');
CREATE TYPE action_status AS ENUM ('pending', 'in_progress', 'done');
```

## 1. Documents

### POST /db/documents
Request:
```
{
  "doc_id": "doc_1",
  "source_id": "rbi_001",
  "source_url": "https://rbi.org/doc1",
  "hash": "abc123",
  "full_text": "Sample regulation text",
  "published_at": "2026-04-28T10:00:00Z"
}
```

Response:
```
{
  "success": true,
  "doc_id": "doc_1"
}
```

### GET /db/documents
Fetch metadata

### GET /db/documents/{doc_id}
Fetch full document

### GET /db/documents/hash/{hash}
Check duplicate


---

## 2. Document Context

### POST /db/documents/{doc_id}/context
```
{
  "summary": "Test summary",
  "keywords": ["rbi", "finance"]
}
```

Response:
```
{
  "doc_id": "doc_1",
  "summary": "Test summary",
  "keywords": ["rbi", "finance"]
}
```

### GET /db/documents/{doc_id}/context


---

## 3. Clauses

### POST /db/documents/{doc_id}/clauses
```
{
  "clauses": [
    {
      "clause_id": "doc_1:c1",
      "text": "Bank must maintain reserves",
      "type": "obligation",
      "deadline": null,
      "extraction_confidence": 0.92
    }
  ]
}
```

Response:
```
{
  "success": true,
  "inserted": 2
}
```

### GET /db/documents/{doc_id}/clauses

### GET /db/documents/{doc_id}/clauses?type=obligation


---

## 4. Clause Mapping

### POST /db/mappings/clause
```
{
  "clause_id": "doc_1:c1",
  "doc_id": "doc_1",
  "mapped_policy": "Liquidity Policy",
  "department": "Risk",
  "gap_detected": true,
  "mapping_confidence": 0.91,
  "reasoning": "Clause requires reserve maintenance",
  "graph_policies": ["policy_graph_1"],
  "semantic_policies": ["policy_vec_1"],
  "mapping_status": "completed"
}
```

### GET /db/mappings/clause/{clause_id}

### GET /db/mappings/document/{doc_id}


---

## 5. Bulk Mapping

### POST /db/mappings/clause/bulk
```
{
  "doc_id": "doc_1",
  "mappings": [
    {
      "clause_id": "doc_1:c1",
      "mapped_policy": "Policy A",
      "department": "Risk",
      "gap_detected": true,
      "mapping_confidence": 0.9,
      "reasoning": "Reason A",
      "graph_policies": ["g1"],
      "semantic_policies": ["s1"],
      "mapping_status": "completed"
    }
  ]
}
```

---

## 6. Mapping Summary

### POST /db/mappings/document/{doc_id}/summary
```
{
  "total_clauses": 2,
  "mapped_clauses": 2,
  "total_gaps": 1,
  "status": "completed"
}
```

## 7. Risk Summary

### POST /db/risk (document level)
```
{
  "doc_id": "doc_1",
  "clause_id": null,
  "risk_score": 0.8,
  "severity": 0.7,
  "impact": 0.9,
  "urgency": 0.6,
  "priority": "high"
}
```

### POST /db/risk (clause level)
```
{
  "doc_id": "doc_1",
  "clause_id": "doc_1:c1",
  "risk_score": 0.6,
  "severity": 0.5,
  "impact": 0.7,
  "urgency": 0.4,
  "priority": "medium"
}
```

### GET - doc risk - /db/risk/doc_id
OUTPUT:
```
{
    "risk_id": "a8665b46-dbbd-47e0-9cbc-3000de2a6b3a",
    "doc_id": "doc_1",
    "clause_id": null,
    "risk_score": "0.800",
    "severity": "0.700",
    "impact": "0.900",
    "urgency": "0.600",
    "priority": "high",
    "scored_at": "2026-04-28T12:52:17.662Z"
}
```
### GET - clause risk - /db/risk/doc_id/clauses
OUTPUTS all clauses:
```
[
    {
        "risk_id": "7854c279-dc1f-4ed5-a2b3-08f8e1b4e6a6",
        "doc_id": "doc_1",
        "clause_id": "doc_1:c1",
        "risk_score": "0.600",
        "severity": "0.500",
        "impact": "0.700",
        "urgency": "0.400",
        "priority": "medium",
        "scored_at": "2026-04-28T12:50:58.673Z"
    }
]
```

## 8. Action summary
### POST /db/actions/bulk
```
{
  "doc_id": "doc_1",
  "actions": [
    {
      "clause_id": "doc_1:c1",
      "action_text": "Update liquidity policy",
      "action_type": "policy_update",
      "department": "Risk"
    },
    {
      "clause_id": "doc_1:c2",
      "action_text": "Trigger compliance audit",
      "action_type": "audit",
      "department": "Compliance"
    }
  ]
}
```
OUTPUT
```
{
    "success": true,
    "inserted": 2
}
```
### GET /db/actions/{doc_id}
OUTPUT
```
[
    {
        "action_id": "e28f6e60-2ef9-4f63-9f36-5d7e4dd3a19c",
        "doc_id": "doc_1",
        "clause_id": "doc_1:c1",
        "action_text": "Update liquidity policy",
        "action_type": "policy_update",
        "department": "Risk",
        "status": "pending",
        "generated_at": "2026-04-28T13:22:18.777Z"
    },
    {
        "action_id": "4ab25bef-ff13-4681-ac53-78c2450ed45a",
        "doc_id": "doc_1",
        "clause_id": "doc_1:c2",
        "action_text": "Trigger compliance audit",
        "action_type": "audit",
        "department": "Compliance",
        "status": "pending",
        "generated_at": "2026-04-28T13:22:18.777Z"
    }
]
```
### PATCH /db/actions/{action_id}/status
