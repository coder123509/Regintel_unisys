# RegIntel Pipeline 3: Risk Scoring & Action Generation
## 🎯 Overview
Pipeline 3 is the **Decision and Action Layer** of the RegIntel Agent. It takes the output from Pipeline 2 (the mapped clauses and gap detection) and translates them into a quantifiable risk profile and actionable recommendations. 
This pipeline converts **analysis → decisions** by:
- **Evaluating mapped clauses**
- **Calculating objective risk scores**
- **Assigning priority levels**
- **Generating actionable recommendations** using LLM.
**Key Outcome**: A clear dashboard view of compliance gaps with prioritized action steps to remediate deficiencies.
---
## 🏗️ Architecture & How It Works
Pipeline 3 follows a structured evaluation flow:
### 1️⃣ Input Reception
- Receives the `doc_id` and fetches the mapped clauses enriched by Pipeline 2.
### 2️⃣ Risk Evaluation Engine
- Analyzes each clause based on three factors:
  - **Severity**: Regulatory impact and importance of the clause.
  - **Impact**: Affected systems or operational magnitude.
  - **Urgency**: Proximity to the implementation deadline.
- Calculates individual and aggregate risk scores using deterministic formulas.
### 3️⃣ Priority Classification
- Categorizes the aggregate risk score into actionable levels:
  - `0.0 – 0.3` → **Low**
  - `0.3 – 0.7` → **Medium**
  - `0.7 – 1.0` → **High**
### 4️⃣ LLM Action Generation
- Feeds the identified compliance gaps and context to an LLM (Gemini 2.5 Flash).
- Generates 3-5 specific, actionable steps (e.g., "Update data policy", "Notify compliance team").
---
## 📂 File Inventory & Responsibilities
### ⚙️ Core Logic (Production APIs)
 File | Purpose 
------|---------
 **`risk_engine.py`** | Risk scoring logic for clauses and document aggregation.
 **`action_generator.py`** | LLM-powered generation of actionable recommendations for detected gaps.
 **`app.py`** | FastAPI server providing the core Pipeline 3 endpoints (`/risk/analyze`, `/actions/generate`, `/dashboard/{doc_id}`).
 **`mock_pipeline2.py`** | Mock data provider to simulate Pipeline 2 output.
 **`test_pipeline3.py`** | Validation script to test endpoints locally.
---
## 🚀 Quick Start Guide
### Prerequisites
- **Python 3.10+** (3.12 verified)
- **Google AI API Key** (for Gemini Flash action generation)
### Step 1: Install Dependencies
```bash
cd pipeline-3
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
### Step 2: Set Up Environment Variables
Create a `.env` file in the `pipeline-3/` directory:
```env
# Google AI Configuration for Action Generation
GEMINI_API_KEY=your_gemini_api_key
```
### Step 3: Run the Server
```bash
uvicorn app:app --host 0.0.0.0 --port 8003 --reload
```
---
## 📋 API Endpoints (FastAPI Reference)
When running `uvicorn app:app --port 8003`, the following endpoints are exposed:
### `POST /risk/analyze`
**Input:** `{"doc_id":"doc_123"}`
**Output:** Calculates and returns the risk score, priority, and factor breakdown.
```json
{
  "doc_id": "doc_123",
  "risk_score": 0.82,
  "priority": "high",
  "breakdown": {
    "severity": 0.9,
    "impact": 0.8,
    "urgency": 0.75
  }
}
```
### `POST /actions/generate`
**Input:** `{"doc_id":"doc_123"}`
**Output:** Returns an AI-generated array of actions to handle identified gaps.
```json
{
  "doc_id": "doc_123",
  "actions": [
    "Update encryption standards",
    "Notify compliance team",
    "Conduct internal audit"
  ]
}
```
### `GET /dashboard/{doc_id}`
**Output:** Provides a comprehensive overview of the evaluation suitable for a UI dashboard.
```json
{
  "doc_id": "doc_123",
  "risk_score": 0.82,
  "priority": "high",
  "actions_count": 3,
  "high_risk_clauses": 4
}
```
---
## 🧪 Testing
To test the pipeline standalone with mock datasets:
```bash
python test_pipeline3.py
```
This will run through internal scoring and action endpoints and output the simulated JSON responses.
---
## 🛠️ Tech Stack
 Component | Technology 
-----------|------------
 **Web Framework** | FastAPI 
 **Action Insights (LLM)** | Gemini 2.5 Flash 
 **Language** | Python 3.10+ 
---
## 🚦 Git Workflow (Team Collaboration)
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
   git commit -m "feat: implemented risk scoring formula"
   git push origin feature/your-name-task
   ```
4. **Open a Pull Request (PR)**: Merge your branch into `main` only after passing tests locally.
