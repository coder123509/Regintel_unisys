# RegIntel API Documentation

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
