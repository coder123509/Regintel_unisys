# Database Microservice

The central REST API layer between all pipelines and the Neon Postgres database. No pipeline talks to Postgres directly — every read and write goes through this service.

---

## Responsibilities

- Owns all database schema and query logic
- Exposes a clean HTTP API consumed by P1, P2, P3, and the Controller
- Manages pipeline status tracking across all three pipelines
- Handles all error mapping from Postgres to HTTP status codes

---

## Tech Stack

| | |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express |
| Database | Neon Postgres (serverless, cloud) |
| DB Driver | `pg` (node-postgres) |
| Modules | ES Modules (`"type": "module"`) |

---

## API Reference

### Documents

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/db/documents` | Insert a new document |
| `GET` | `/db/documents` | List all documents (metadata only) |
| `GET` | `/db/documents/{doc_id}` | Fetch full document including text |
| `GET` | `/db/documents/hash/{hash}` | Deduplication check — returns `{exists, doc_id?}` |
| `PATCH` | `/db/documents/{doc_id}/status` | Update document status |

### Document Context

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/db/documents/{doc_id}/context` | Insert summary and keywords |
| `GET` | `/db/documents/{doc_id}/context` | Fetch summary and keywords |

### Clauses

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/db/documents/{doc_id}/clauses` | Bulk insert extracted clauses |
| `GET` | `/db/documents/{doc_id}/clauses` | Fetch all clauses. Supports `?type=` filter |
| `GET` | `/db/clauses/{clause_id}` | Fetch single clause |

### Clause Mappings

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/db/mappings/clause` | Upsert single clause mapping |
| `POST` | `/db/mappings/clause/bulk` | Bulk upsert clause mappings for a document |
| `GET` | `/db/mappings/clause/{clause_id}` | Fetch single clause mapping |
| `GET` | `/db/mappings/document/{doc_id}` | Fetch all mappings for a document |
| `POST` | `/db/mappings/document/{doc_id}/summary` | Upsert document mapping summary |
| `GET` | `/db/mappings/document/{doc_id}/summary` | Fetch mapping summary |

### Risk Scores

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/db/risk` | Insert risk score (doc-level or clause-level) |
| `GET` | `/db/risk/{doc_id}` | Fetch document-level risk score |
| `GET` | `/db/risk/{doc_id}/clauses` | Fetch all clause-level risk scores |

### Actions

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/db/actions/bulk` | Bulk insert generated actions |
| `GET` | `/db/actions/{doc_id}` | Fetch all actions for a document |
| `PATCH` | `/db/actions/{action_id}/status` | Update action status |

### Pipeline Status

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/db/pipeline-status` | Create status row for a new document |
| `PATCH` | `/db/pipeline-status/{doc_id}` | Update pipeline stage status |
| `GET` | `/db/pipeline-status/{doc_id}` | Fetch status for one document |
| `GET` | `/db/pipeline-status` | Fetch status for all documents |

---

## Database Schema

```
documents               — core document record
document_context        — summary + keywords (1:1 with documents)
clauses                 — extracted regulatory clauses (1:N)
clause_mappings         — P2 mapping results per clause (1:1 with clauses)
document_mapping_summary — aggregated mapping stats per doc (1:1)
risk_scores             — clause-level and doc-level risk (1:N)
actions                 — generated remediation actions (1:N)
pipeline_status         — P1/P2/P3 processing state per doc (1:1)
```

### ENUM Types

```sql
document_status  → ingesting | processed | failed | duplicate
clause_type      → obligation | prohibition | permission
mapping_status   → pending | completed | failed | partial
priority_level   → low | medium | high
action_type      → policy_update | alert | audit | checklist
action_status    → pending | in_progress | done
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `NODE_OPTIONS` | Set to `--dns-result-order=ipv4first` in Docker |

---

## Running Locally

```bash
cd backend/database
npm install
node index.js
or
npm run dev
```

Service starts on `http://localhost:5000`.