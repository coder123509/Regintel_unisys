
# RegIntel Pipeline 2: Hybrid RAG & Compliance Mapping Engine

## 🎯 Overview

Pipeline 2 is the **Intelligence Layer** of the RegIntel Agent. It bridges the gap between raw regulatory ingestion (Pipeline 1) and actionable risk assessment (Pipeline 3).

This module performs **Hybrid RAG (Retrieval-Augmented Generation)** by combining:
- **Structured data** from a **Neo4j Knowledge Graph** (explicit policy relationships)
- **Semantic context** from a **ChromaDB Vector Database** (AI-powered similarity matching)
- **AI Reasoning** with **Gemini 2.5 Flash** LLM for compliance gap detection

**Key Outcome**: For each RBI regulatory clause, Pipeline 2 determines if your internal policies adequately cover the requirement and identifies gaps.

---

## 🏗️ Architecture & How It Works

Pipeline 2 follows a **three-step orchestration logic**:

### 1️⃣ Hybrid Retrieval (Dual-Source Context Gathering)
- **Graph Search (Neo4j)**: Queries explicit `MAPS_TO` and `ENFORCES` relationships between RBI Clauses and Internal Policies
- **Semantic Search (ChromaDB)**: Uses AI embeddings to find the top 3 most similar policies by meaning (even without graph links)
- **Fusion**: Combines both sources into a unified context

### 2️⃣ Context Preparation
- Structures retrieved data into a "Case File" containing:
  - The RBI clause text
  - All candidate internal policies (with similarity scores)
  - Graph-based evidence (if any exists)

### 3️⃣ AI-Powered Compliance Analysis
- **Gemini 2.5 Flash** acts as a Senior Compliance Officer
- Detects technical gaps (e.g., RBI requires 24/7 monitoring but policy says "business hours")
- Returns a structured JSON with:
  - Mapped policy name and owning department
  - Gap detection (boolean)
  - Mapping confidence score (0.0-1.0)
  - Technical reasoning

---

## 📂 File Inventory & Responsibilities

### ⚙️ Core Logic (Production APIs)
| File | Purpose |
|------|---------|
| **`services.py`** | `MappingService` class—fetches hybrid context (graph + vector matches) for any clause |
| **`mapping_logic.py`** | `analyze_mapping_with_llm()` function—sends context to Gemini and returns compliance verdict |
| **`app.py`** | FastAPI web server—exposes Pipeline 2 as REST endpoints for Pipeline 1 integration |

### 🗄️ Database & Ingestion (Setup & Configuration)
| File | Purpose |
|------|---------|
| **`main.py`** | Setup orchestrator—run this once to bootstrap Neo4j → ChromaDB ingestion |
| **`extract.py`** | Neo4j connector—pulls policy text and metadata from your knowledge graph |
| **`embed.py`** | Vector engine—generates embeddings using Sentence-Transformers and upserts to ChromaDB |
| **`graph.py`** | Low-level Neo4j utilities (reference only—do not run directly) |

### 🧪 Testing & Validation
| File | Purpose |
|------|---------|
| **`test_pipeline.py`** | Full integration test—simulates Pipeline 1 → Pipeline 2 → output with mock data |
| **`mapping_engine.py`** | Quick semantic test—runs RBI clauses from CSV against ChromaDB to validate embeddings |
| **`mock_pipeline1.py`** | Mock data generator—simulates Pipeline 1 JSON output for isolated testing |

### 📊 Data & Models
| File | Purpose |
|------|---------|
| **`datasets/`** | Sample CSV files (regulatory clauses, internal policies, departments, IT controls) |
| **`compliance_db/`** | ChromaDB persistent storage directory—contains vector embeddings |
| **`my_local_model/`** | **⚠️ IMPORTANT**: Sentence-Transformers model (not in git—see setup below) |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** (3.11 recommended)
- **Neo4j Aura** or **Neo4j Local** instance (with pre-populated policies)
- **Google AI API Key** (for Gemini 2.5 Flash access)
- **~2 GB disk space** (for local model + vector DB)

### Step 1: Install Dependencies

```bash
cd knowledge_graph
pip install -r requirements.txt
```

**Note**: If you encounter PyTorch installation issues on Windows, the requirements.txt already includes the CPU-only version. For GPU support, use:
```bash
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the `knowledge_graph/` directory:

```env
# Neo4j Configuration
NEO4J_URI=neo4j+s://your-neo4j-instance-url
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# Google AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# Optional: Pipeline 1 Integration
PIPELINE_1_URL=http://localhost:8001
```

**How to get credentials:**
- **Neo4j URI & Password**: From your Neo4j Aura console or local instance
- **Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/app/apikey)

### Step 3: Download the Sentence-Transformers Model

The `my_local_model/` folder contains the **all-MiniLM-L6-v2** model from Hugging Face. This is a **large binary file (~90 MB)** and is therefore **NOT included in git** to keep the repository lean.

#### Option A: Automatic Download (Recommended)
Run this Python script to automatically download the model:

```python
from sentence_transformers import SentenceTransformer

# This will download and cache the model
model = SentenceTransformer('all-MiniLM-L6-v2')

# It saves to: ~/.cache/huggingface/hub/
# But for this project, we want it in ./my_local_model/
import shutil
import os

# Copy to local project directory
shutil.copytree(
    os.path.expanduser('~/.cache/huggingface/hub/models--sentence-transformers--all-MiniLM-L6-v2/snapshots/[latest_snapshot_id]'),
    './my_local_model',
    dirs_exist_ok=True
)
```

#### Option B: Manual Configuration
If you prefer to use the Hugging Face model directly without downloading locally:

1. Open `embed.py`
2. Replace this line:
   ```python
   MODEL_PATH="./my_local_model"
   ```
   With:
   ```python
   MODEL_PATH="sentence-transformers/all-MiniLM-L6-v2"
   ```
3. This will download the model on-the-fly (requires internet on first run)

**Important**: The model file must be present or accessible before running any embedding operations. If the path is invalid, you'll get a `FileNotFoundError` when initializing ChromaDB.

### Step 4: Initialize ChromaDB with Your Policies

This step extracts policies from Neo4j and creates vector embeddings:

```bash
python main.py
```

**Expected Output**:
```
--- Step 1: Extracting from Knowledge Graph ---
--- Step 2: Ingesting 47 policies into ChromaDB ---
✓ ChromaDB: Upserted 47 policy vectors.
Pipeline execution successful!
```

This creates the `compliance_db/` folder with persistent storage.

---

## ▶️ Running Pipeline 2

### Option 1: FastAPI Web Server (For Production & Integration)

```bash
uvicorn app:app --host 0.0.0.0 --port 8002 --reload
```

**Access the API**:
- Base URL: `http://localhost:8002`
- Docs: `http://localhost:8002/docs` (Swagger UI)

**Example Request** (via Pipeline 1 integration):
```python
import requests

response = requests.post(
    "http://localhost:8002/map-clause",
    json={
        "clause_id": "RBI_2024_001",
        "clause_text": "Banks must implement 24/7 monitoring systems for suspicious transactions."
    }
)

print(response.json())
```

### Option 2: Full Integration Test

Test the entire flow from mock regulatory data to mapped clauses:

```bash
python test_pipeline.py
```

**Expected Output**:
```
🚀 Starting Integration Test: CSV -> Hybrid RAG -> Gemini 2.5 Flash

🔍 Processing: RBI_CLAUSE_001...
✅ Test Complete. Final Enriched JSON:
[
  {
    "clause_id": "RBI_CLAUSE_001",
    "text": "...",
    "mapping_data": {
      "mapped_policy": "Transaction Monitoring Policy",
      "department": "Risk Management",
      "gap_detected": false,
      "mapping_confidence": 0.89,
      "reasoning": "..."
    }
  }
]
```

### Option 3: Quick Semantic Test

Quickly test if vector embeddings are working correctly:

```bash
python mapping_engine.py
```

**This verifies**:
- ChromaDB is accessible
- Vector embeddings are functioning
- Sample clauses from CSV find matching policies

---

## 🔌 Integration with Pipeline 1

### From Pipeline 1 to Pipeline 2

When Pipeline 1 extracts clauses from an RBI document, pass each clause to Pipeline 2:

```python
from services import MappingService
from mapping_logic import analyze_mapping_with_llm
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize service
mapping_service = MappingService(
    os.getenv("NEO4J_URI"),
    (os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD"))
)

# For each clause from Pipeline 1:
for clause in pipeline_1_clauses:
    # Step 1: Get hybrid context (graph + vector search)
    context = mapping_service.get_hybrid_context(
        clause_id=clause['id'],
        clause_text=clause['text']
    )
    
    # Step 2: Analyze with LLM
    mapping_result = analyze_mapping_with_llm(context)
    
    # Step 3: Attach to clause and send to Pipeline 3
    clause['mapping_data'] = mapping_result['mapping_data']
    send_to_pipeline_3(clause)
```

### Output Structure

Each enriched clause sent to Pipeline 3 includes:

```json
{
  "clause_id": "RBI_2024_001",
  "clause_text": "...",
  "mapping_data": {
    "mapped_policy": "Transaction Monitoring Policy",
    "department": "Risk Management",
    "gap_detected": false,
    "mapping_confidence": 0.89,
    "reasoning": "The internal policy explicitly requires 24/7 automated monitoring..."
  }
}
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Graph Database** | Neo4j 5.19+ |
| **Vector Database** | ChromaDB 0.4.24 |
| **LLM** | Gemini 2.5 Flash |
| **Embeddings** | Sentence-Transformers (all-MiniLM-L6-v2) |
| **Web Framework** | FastAPI 0.110+ |
| **Language** | Python 3.10+ |

---

## 📋 API Endpoints (FastAPI Reference)

When running `uvicorn app:app --reload`, the following endpoints are available:

### GET `/`
Health check endpoint.

**Response**:
```json
{
  "module": "Pipeline 2: RAG mapping engine",
  "status": "active"
}
```

*(Additional endpoints defined in `app.py` for clause processing)*

---

## ⚠️ Troubleshooting

### Issue: `FileNotFoundError: ./my_local_model not found`

**Solution**: 
Download the model using the setup instructions (Step 3 above) or modify `embed.py` to use the Hugging Face model directly:
```python
MODEL_PATH="sentence-transformers/all-MiniLM-L6-v2"
```

### Issue: Neo4j Connection Failed

**Check**:
1. Verify credentials in `.env` are correct
2. Confirm Neo4j instance is running: `neo4j status`
3. Test connectivity: `telnet <NEO4J_HOST> 7687`

### Issue: ChromaDB Collection Error

**Solution**:
Delete the corrupted database and reinitialize:
```bash
rm -rf compliance_db/
python main.py
```

### Issue: Gemini API Rate Limit / 503 Errors

**Note**: The `app.py` includes automatic retry logic with exponential backoff. If limits persist, add delays between requests or contact Google Cloud Support for quota increase.

### Issue: Slow Embeddings / High CPU Usage

**Optimization**:
- Batch embeddings: Process multiple clauses at once instead of individually
- Use GPU: Install CUDA-enabled PyTorch (see dependencies)
- Reduce `n_results` in `retrieve_policy_matches()` if not needed

---

## 📊 Expected Data Files

The following CSV files should be pre-populated in `datasets/`:

- **`regulatory_clauses.csv`**: RBI circular clauses (used for testing)
- **`internal_policies.csv`**: Bank internal policies
- **`departments.csv`**: Organizational departments
- **`it_controls.csv`**: IT control frameworks

---

## 🔐 Security Notes

1. **`.env` is committed to git** for team access to shared Neo4j Aura credentials. The `.gitignore` file excludes only:
   - `compliance_db/` (regenerable via `main.py`)
   - `my_local_model/` (users download separately)
   - `__pycache__/`, `.venv/`, and IDE settings (standard exclusions)

2. **Sensitive Credentials**: The `.env` file contains shared credentials for Neo4j Aura. Handle responsibly:
   - Only share credentials via secure channels
   - Never paste credentials in chat/email
   - For production, use Azure Key Vault or similar secure management systems

3. **Neo4j**: Use connection encryption (neo4j+s) in production.

---

## 📞 Support & Feedback

For issues or questions:
1. Check the logs in terminal output
2. Review the code comments in each module
3. Reference the [ChromaDB Docs](https://docs.trychroma.com/) or [Neo4j Python Docs](https://neo4j.com/docs/python-manual/)

---

## 📝 License

Part of the RegIntel Unisys project.

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
GEMINI_API_KEY=your-api-key
CHROMA_DB_PATH=./compliance_db
PIPELINE_1_URL=http://localhost:8001
```

### 3. Installation
```bash
pip install -r requirements.txt
```

---

## 🚦 Git Workflow (Team Collaboration)

To ensure we don't overwrite each other's work, please follow this workflow:

1. **Pull Latest Main**:
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-name-task
   ```
3. **Commit & Push**:
   ```bash
   git add .
   git commit -m "feat: updated mapping logic with retry mechanism"
   git push origin feature/your-name-task
   ```
4. **Open a Pull Request (PR)**: Merge your branch into `main` only after passing the local `test_pipeline.py`.

---

## ⚡ Execution Guide

### Phase 1: Ingestion (Run Once)
To load internal policies from the knowledge graph into the vector database:
```bash
python main.py
```

### Phase 2: Live Service (API)
Start the FastAPI server:
```bash
uvicorn app:app --port 8002 --reload
```

### Phase 3: Testing (Stand-alone)
If Pipeline 1 is not yet live, run the integration test using the mock dataset:
```bash
python test_pipeline.py
```

---

## 📡 API Endpoints
* `GET /rag/map/{doc_id}`: Returns a fully enriched document with policy mappings and gap detection.
* `GET /rag/map/{doc_id}/{clause_id}`: Returns a deep-dive reasoning for a specific clause, including retrieval sources.

---

## 📄 Data Schema Example
The final output to Pipeline 3 follows this structure:
```json
{
  "clause_id": "RBI-DPS-01",
  "mapping_data": {
    "mapped_policy": "Sensitive Data Masking Standard",
    "gap_detected": false,
    "mapping_confidence": 0.88,
    "reasoning": "Policy POL-DAT-402 explicitly covers PAN masking requirements."
  }
}
```
```

