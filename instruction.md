# Running RegIntel with Docker Compose

All services are containerised and managed from a single `docker-compose.yml` at the project root.

---

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- At least **8GB RAM** allocated to Docker (Pipeline 1 loads Legal-BERT, Pipeline 2 loads sentence-transformers)
- Accounts / API keys for:
  - [Neon](https://neon.tech) — PostgreSQL database
  - [Groq](https://console.groq.com) — LLM for Pipeline 1
  - [Google AI Studio](https://aistudio.google.com) — Gemini for Pipeline 2 & 3
  - [Neo4j AuraDB](https://neo4j.com/cloud/aura/) — Knowledge graph for Pipeline 2

---

## Step 1 — Clone and enter the project

```bash
git clone <your-repo-url>
cd <project-root>
```

---

## Step 2 — Create the `.env` file

Create a `.env` file at the **project root** (same level as `docker-compose.yml`):

```env
# =========================
# DATABASE (Neon)
# =========================
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require

# =========================
# LLM APIs
# =========================
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# =========================
# Neo4j (AuraDB)
# =========================
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USER=your_neo4j_username
NEO4J_PASSWORD=your_neo4j_password
```

> **Never commit your `.env` file.** It is listed in `.gitignore`.

---

## Step 3 — One-time Pipeline 2 setup

Before running the full stack for the first time, Pipeline 2 requires its knowledge graph and vector database to be seeded.

```bash
cd backend/pipeline-2
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python3 -m knowledge_graph.main
```

This seeds Neo4j from the CSV datasets and populates ChromaDB with policy embeddings. Run it **once** — the data persists in Docker volumes after that.

---

## Step 4 — One-time Legal-BERT download (Pipeline 1)

Pipeline 1 uses Legal-BERT for clause embeddings. Download and save the model locally before building:

```bash
cd backend/pipeline-1
python3 -c "
from transformers import AutoTokenizer, AutoModel
tokenizer = AutoTokenizer.from_pretrained('nlpaueb/legal-bert-base-uncased')
model = AutoModel.from_pretrained('nlpaueb/legal-bert-base-uncased')
tokenizer.save_pretrained('./legal_bert_local')
model.save_pretrained('./legal_bert_local')
print('Saved.')
"
```

---

## Step 5 — Build and run

From the project root:

```bash
docker-compose up --build
```

To run in the background:

```bash
docker-compose up --build -d
```

---

## Service URLs

| Service | URL |
|---|---|
| DB Microservice | http://localhost:5000 |
| Pipeline 2 API | http://localhost:8002 |
| Pipeline 3 API | http://localhost:8003 |
| Frontend | http://localhost:3000 |

---

## Useful Commands

```bash
# View logs for all services
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f pipeline-1
docker-compose logs -f controller

# Stop all services
docker-compose down

# Stop and remove all volumes (full reset)
docker-compose down -v

# Rebuild a single service after code changes
docker-compose up --build pipeline-2
```

---

## Startup Order

Docker Compose handles the startup order automatically:

```
Neon PostgreSQL (external)
        ↓
database-service  (waits for Neon to be reachable)
        ↓
pipeline-1, pipeline-2, pipeline-3  (wait for database-service)
        ↓
controller  (waits for database-service healthy + p2 + p3 ready)
        ↓
frontend
```

The controller will retry connecting to each service until they are ready — no manual intervention needed.

---

## Verifying Everything Works

```bash
# Check all containers are running
docker-compose ps

# Check pipeline status table
curl http://localhost:5000/db/pipeline-status

# Manually trigger P2 for a document
curl http://localhost:8002/rag/map/<doc_id>

# Manually trigger P3 for a document
curl -X POST http://localhost:8003/risk/analyze/<doc_id>

# Check actions generated
curl http://localhost:5000/db/actions/<doc_id>
```