# RegIntel — Regulatory Intelligence Platform

RegIntel is an automated compliance intelligence system that continuously monitors regulatory sources (RBI), extracts structured clauses, maps them to internal policies, scores risk, and generates actionable recommendations — all without manual intervention.

---

## What It Does

1. **Ingests** newly published regulatory PDFs from RBI automatically
2. **Extracts** structured clauses using Groq (Llama 3.3 70B) + Legal-BERT embeddings
3. **Maps** each clause to internal policies via a hybrid Neo4j graph + ChromaDB vector search, reasoned by Gemini
4. **Scores** compliance risk per clause and per document
5. **Generates** actionable remediation recommendations
6. **Tracks** the full journey of every document across all pipelines in real time

---

## System Architecture

```
RBI Website
     ↓
Pipeline 1 — Ingestion & Clause Extraction
     ↓  (doc_id emitted)
Controller — Orchestrates P1 → P2 → P3 sequentially
     ↓
Pipeline 2 — RAG + Knowledge Graph + LLM Mapping
     ↓
Pipeline 3 — Risk Scoring + Action Generation
     ↓
Database Service — PostgreSQL via Neon (single source of truth)
     ↓
Frontend — React dashboard
```

---

## Repository Structure

```
root/
├── docker-compose.yml          # Orchestrates all services
├── .env                        # Shared environment variables
├── INSTRUCTIONS.md             # How to run the project
│
├── frontend/                   # React + Vite dashboard
│
└── backend/
    ├── database/               # Node.js DB microservice (REST API over Neon PostgreSQL)
    ├── pipeline-1/             # Python — ingestion, clause extraction
    ├── pipeline-2/             # Python — RAG, mapping, LLM reasoning
    ├── pipeline-3/             # Python — risk scoring, action generation
    └── controller/             # Python — pipeline orchestration controller
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Ingestion LLM | Groq — Llama 3.3 70B |
| Clause Embeddings | Legal-BERT |
| Mapping LLM | Gemini 2.5 Flash |
| Graph DB | Neo4j AuraDB |
| Vector DB | ChromaDB |
| Relational DB | PostgreSQL via Neon |
| DB API | Node.js + Express |
| Pipelines | Python + FastAPI |
| Frontend | React 19 + Vite |
| Containerisation | Docker + Docker Compose |

---

## Quick Start

See **[INSTRUCTIONS.md](./instruction.md)** for the full setup and run guide.

## Team Details
### Team members: Ahibhruth A, Amogh AP, Abhinav Krishna Rayachoti, Srikanth R
### Mentor: Dr. Mohana M , Dr Sudharshan 
### Institution: RV College of Engineering, Bengaluru
### Unisys Mentor - Siddharth Dash 
