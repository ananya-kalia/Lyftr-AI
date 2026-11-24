# Lyftr AI — LLM Chatbot with Key Failover and Response Caching

A production-ready full-stack AI chatbot application featuring **multi-turn conversation memory (SQLite)**, **LiteLLM multi-key automatic failover**, **response caching (`LIVE_INFERENCE` vs `LLM_CACHE`)**, and a sleek **Perplexity-style React user interface**.

---

## 📑 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Key Features & Engineering](#-key-features--engineering)
3. [Required Frontend Test IDs](#-required-frontend-test-ids)
4. [API Specification](#-api-specification)
5. [Quickstart with Docker (`make up`)](#-quickstart-with-docker)
6. [Local Development (Without Docker)](#-local-development-without-docker)
7. [Automated Pytest Suite](#-automated-pytest-suite)
8. [Testing Key Failover & Caching](#-testing-key-failover--caching)
9. [Deployment Guide (Vercel & Render)](#-deployment-guide-vercel--render)

---

## 🏗 Architecture Overview

```
               ┌────────────────────────────────────────────────────────┐
               │                     React Frontend                     │
               │        (Perplexity-style UI, Port 3000, Vite)          │
               │   - Multi-turn Chat Thread    - Metadata Inspection    │
               │   - Session Manager           - Failover Simulation    │
               └───────────────────────────┬────────────────────────────┘
                                           │ HTTP (REST)
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                     FastAPI Backend                    │
               │                      (Port 8000)                       │
               │    POST /chat    GET /health    GET /sessions/...      │
               └───────────────┬────────────────────────┬───────────────┘
                               │                        │
               ┌───────────────▼──────────────┐  ┌──────▼───────────────┐
               │        SQLite Database       │  │    LLM Service       │
               │   - Multi-turn Messages      │  │ (LiteLLM Routing)    │
               │   - Session History          │  │                      │
               │   - Mounted to /data volume  │  │ - Key Failover Pool  │
               └──────────────────────────────┘  │ - Response Caching   │
                                                 │ - Token Tracking     │
                                                 └──────────┬───────────┘
                                                            │
                                              ┌─────────────▼─────────────┐
                                              │      AI Model Engine      │
                                              │   (Gemini 2.0 Flash /     │
                                              │    Multi-Key Failover)    │
                                              │                           │
                                              │ Key 1 (Try) ──429 Limit──┐│
                                              │ Key 2 (Fallback) ◄───────┘│
                                              └───────────────────────────┘
```

---

## ⚡ Key Features & Engineering

### 1. Multi-Turn Conversation (Chat Memory)
- **Session Identification:** When the user enters the application, a unique `session_id` is automatically maintained.
- **Backend Memory Retrieval:** The frontend sends *only* the new message and `session_id`. The backend fetches all previous exchanges from SQLite and passes the structured dialogue sequence to the LLM.
- **Two-way Persistence:** Both the user prompt and the assistant response (along with its rich metadata) are persisted to SQLite.

### 2. Automatic API Key Failover (`X-Simulate-Failure`)
- **Key Pool:** Configured with multiple API keys (`key_1`, `key_2`, etc.).
- **Automatic Fallback:** When `key_1` encounters an HTTP 429 (Rate Limit) or provider failure, the application automatically retries with `key_2`, returns `key_id: "key_2"`, and increments `fallback_attempts: 1`.
- **Testing via Header:** Includes full support for the `X-Simulate-Failure` header:
  - `X-Simulate-Failure: key_1=429`: Deliberately fails `key_1` to test failover to `key_2`.
  - `X-Simulate-Failure: key_1=429,key_2=500`: Fails all keys, returning a clean `503 Service Unavailable` with `"detail": "all providers unavailable"` (no crashes, no broken screens).
- **Interactive UI Testing:** Built-in **Failover & Simulation Drawer** in the frontend allowing one-click testing of failure scenarios.

### 3. Response Caching (`LIVE_INFERENCE` vs `LLM_CACHE`)
- **Deterministic Prompt & History Hashing:** LiteLLM cache indexes responses using a SHA-256 hash of the exact prompt and full conversation history.
- **Resolution Source Display:**
  - `LIVE_INFERENCE`: Generated fresh from the AI model (shows live latency, e.g., ~800ms).
  - `LLM_CACHE`: Retrieved instantly from cache with near-zero latency (~2–15ms).
- **History Isolation:** The cache distinguishes identical questions that have different prior conversational context.

### 4. SQLite Database & Docker Volume Persistence
- **Table Schema:**
  ```sql
  CREATE TABLE messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
- **Data Persistence:** Database stored at `/data/app.db` and mounted to a Docker named volume (`sqlite_data`), ensuring chat history survives container restarts and upgrades.

---

## 🎯 Required Frontend Test IDs

The company automated grading suite checks for exact `data-testid` attributes. All 8 required test IDs are implemented and verified:

| `data-testid` | Location | Description |
| :--- | :--- | :--- |
| `chat-input` | Message Input Area | Textarea / input for user questions |
| `send-button` | Send Button | Triggers message submission |
| `assistant-message`| Message Card | Container for each assistant message |
| `meta-source` | Resolution Badge | Displays `LIVE_INFERENCE` or `LLM_CACHE` |
| `meta-model` | Model Badge | Displays AI model name (e.g. `gemini/gemini-2.0-flash`) |
| `meta-latency` | Metric Span | Displays latency in milliseconds (e.g. `812 ms`) |
| `meta-input-tokens`| Metric Span | Displays prompt token count |
| `meta-output-tokens`| Metric Span | Displays response token count |

---

## 📡 API Specification

### 1. `GET /health`
Verifies backend, database connectivity, cache status, and key pool health.
```bash
curl -X GET http://localhost:8000/health
```
**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "cache": "ready",
  "key_pool": {
    "total_keys": 2,
    "keys_configured": ["key_1", "key_2"]
  }
}
```

---

### 2. `POST /chat`
Processes conversational queries with memory, caching, and key failover.
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "sess_demo_101",
    "message": "What is machine learning?"
  }'
```
**Response (Exact Assignment Fields):**
```json
{
  "session_id": "sess_demo_101",
  "reply": "Machine learning is a branch of artificial intelligence that enables systems to learn from data...",
  "metadata": {
    "resolution_source": "LIVE_INFERENCE",
    "model": "gemini/gemini-2.0-flash",
    "latency_ms": 812,
    "input_tokens": 42,
    "output_tokens": 35,
    "key_id": "key_1",
    "fallback_attempts": 0
  }
}
```

#### Simulating Failover via Header:
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "X-Simulate-Failure: key_1=429" \
  -d '{
    "session_id": "sess_demo_102",
    "message": "Explain failover mechanisms."
  }'
```
**Response:**
```json
{
  "session_id": "sess_demo_102",
  "reply": "...",
  "metadata": {
    "resolution_source": "LIVE_INFERENCE",
    "model": "gemini/gemini-2.0-flash",
    "latency_ms": 830,
    "input_tokens": 38,
    "output_tokens": 45,
    "key_id": "key_2",
    "fallback_attempts": 1
  }
}
```

---

### 3. `GET /sessions/{session_id}/messages`
Retrieves chronological message history for a conversation.
```bash
curl -X GET http://localhost:8000/sessions/sess_demo_101/messages
```

---

## 🐳 Quickstart with Docker

### Prerequisites
- [Docker Desktop](https://www.docker.com/) installed and running.
- `make` (or run `docker compose` directly).

### 1. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional)* Add your Gemini API keys from [Google AI Studio](https://aistudio.google.com/):
```env
LLM_API_KEYS=key_1:YOUR_GEMINI_API_KEY_1,key_2:YOUR_GEMINI_API_KEY_2
```
> **Note:** If no keys are provided, the system automatically uses mock keys with contextual intelligence, allowing full offline testing of failover, caching, and token counting!

### 2. Launch Application
```bash
make up
```
- **React Frontend:** [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend:** [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Stop Application
```bash
make down
```
*(Conversation history remains preserved in the `sqlite_data` volume)*

---

## 💻 Local Development (Without Docker)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Automated Pytest Suite

Run the comprehensive pytest suite verifying all 5 core requirements:
```bash
python -m pytest backend/tests/test_chat.py -v
```

### Test Coverage Summary:
- `test_health_endpoint`: Checks backend, database, cache, and key pool status.
- `test_multi_turn_conversation_chat_memory`: Verifies context retention across turns in a session.
- `test_response_caching`: Verifies `LIVE_INFERENCE` on first query and `LLM_CACHE` on repeated queries.
- `test_api_key_failover_simulation`: Verifies automatic failover from `key_1` to `key_2` with `X-Simulate-Failure: key_1=429`.
- `test_all_providers_unavailable_503`: Verifies clean HTTP 503 response when all keys fail.
- `test_metadata_structure_exact_keys`: Validates exact metadata keys and data types.

---

## 🌐 Deployment Guide (Vercel & Render)

### Deploy Backend to [Render](https://render.com)
1. Push your project to GitHub.
2. In Render dashboard, click **New +** → **Web Service**.
3. Select your GitHub repository.
4. Set:
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Add Persistent Disk:**
   - Under **Disks**, add a Disk mounted at `/data` (e.g. 1 GB).
6. **Environment Variables:**
   - `DATABASE_URL`: `sqlite:////data/app.db`
   - `LLM_API_KEYS`: `key_1:AIza...,key_2:AIza...`
   - `ALLOWED_ORIGINS`: `https://your-frontend.vercel.app`
7. Copy your deployed Render URL (e.g. `https://lyftr-backend.onrender.com`).

### Deploy Frontend to [Vercel](https://vercel.com)
1. In Vercel dashboard, click **Add New** → **Project**.
2. Select your GitHub repository.
3. Set:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables:**
   - `VITE_API_URL`: `https://lyftr-backend.onrender.com` (your deployed Render URL)
5. Click **Deploy**. Your chatbot is now live online!
