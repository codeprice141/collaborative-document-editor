# Real-Time Collaborative Document Editor

A Google Docs-style real-time collaborative document editor built with **FastAPI**, **React**, **WebSockets**, **PostgreSQL**, **Redis**, and conflict-free real-time synchronization.

---

## 👥 Team & Responsibilities
- **Member 1:** Backend Architecture, PostgreSQL / Schemas, Auth APIs, Document CRUD, WebSocket Server, Synchronization Engine (Server), Redis Presence & Scaling, Backend & Load Testing.
- **Member 2:** Frontend Application, React Layouts & Routing, Editor UI, WebSocket Client Integration, Presence & Cursors UI, Frontend Testing.
- **Shared:** System Architecture, API & WebSocket Contracts, Synchronization Protocol Design, Pull Request Reviews.

---

## 🗺️ Phased Roadmap
- [x] **Phase 1: Foundation** (FastAPI + PostgreSQL + Docker Compose + /health | React foundation + routes)
- [ ] **Phase 2: Authentication** (JWT login/register API & UI)
- [ ] **Phase 3: Documents & Permissions** (Document CRUD, viewer/editor roles)
- [ ] **Phase 4: Editor** (Rich-text editor component & single-user state)
- [ ] **Phase 5: WebSocket Collaboration** (Real-time rooms & connection handling)
- [ ] **Phase 6: Synchronization Engine** (CRDT/OT concurrent edit convergence)
- [ ] **Phase 7: Presence & Cursors** (Live collaborator presence & cursor positions)
- [ ] **Phase 8: Reconnect & Recovery** (Missed operation sync on reconnect)
- [ ] **Phase 9: Comprehensive Testing** (End-to-end integration & reliability test suite)
- [ ] **Phase 10: Horizontal Scaling** (Redis Pub/Sub multi-instance scaling)
- [ ] **Phase 11: Benchmark & Capacity Testing** (100–5,000 concurrent user load test)
- [ ] **Phase 12: Production Hardening** (Prometheus/Grafana observability & metrics)

---

## ⚡ Quickstart (Phase 1 Foundation)

### Prerequisites
- Docker & Docker Compose
- Python 3.10+
- Node.js 18+ (for Frontend in upcoming steps)

### 1. Clone & Setup Environment
```bash
cp .env.example .env
```

### 2. Start PostgreSQL Database
```bash
docker compose up -d postgres
# or: docker run -d --name collaborative_doc_postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=collaborative_editor -p 5432:5432 postgres:16-alpine
```

### 3. Start Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Verify Endpoints
- Health check: `curl http://localhost:8000/health`
- API v1 Health check: `curl http://localhost:8000/api/v1/health`
- Interactive API Docs: `http://localhost:8000/api/v1/docs`

### 5. Run Automated Tests
```bash
cd backend
pytest -v
```

---

## 📜 Development Rules
1. Never develop directly on `main`. Create feature branches (`feature/backend-foundation`, `feature/auth-api`, etc.).
2. Every feature goes through a Pull Request and requires partner review.
3. Every phase must have passing automated tests before moving to the next phase.
4. Keep the modular monolith clean; do not introduce premature complexity.
