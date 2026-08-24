# Collaborative Document Editor - Backend

FastAPI modular monolith backend service for the Real-time Collaborative Document Editor.

---

## 🛠️ Tech Stack (Phase 1 Foundation)
- **Framework:** FastAPI (Python 3.10+)
- **ASGI Server:** Uvicorn
- **ORM & Migrations:** SQLAlchemy 2.0, Alembic
- **Database:** PostgreSQL 16
- **Validation & Settings:** Pydantic v2, Pydantic-Settings
- **Testing:** Pytest, HTTPX

---

## 🚀 Getting Started

### 1. Environment Setup
Copy the `.env.example` file to `.env`:
```bash
cp ../.env.example .env
```

### 2. Start PostgreSQL Database
Using Docker Compose from the project root:
```bash
docker compose up -d postgres
# or if using older docker-compose:
docker-compose up -d postgres
```

### 3. Install Python Dependencies
Create and activate a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Run the Development Server
```bash
uvicorn app.main:app --reload --port 8000
```

The service will be available at:
- **Root:** [http://localhost:8000/](http://localhost:8000/)
- **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)
- **API v1 Health:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- **Interactive Swagger Docs:** [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **ReDoc:** [http://localhost:8000/api/v1/redoc](http://localhost:8000/api/v1/redoc)

---

## 🧪 Running Automated Tests
Run tests using pytest:
```bash
pytest
```
To run with verbose output:
```bash
pytest -v
```

---

## 📂 Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entrypoint & middleware
│   ├── api/                 # API route handlers (v1)
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── health.py    # Health check endpoint
│   │       └── router.py    # API v1 route aggregator
│   ├── core/                # Core configurations & database session
│   │   ├── __init__.py
│   │   ├── config.py        # Pydantic Settings (.env management)
│   │   └── database.py      # SQLAlchemy engine & session factory
│   ├── models/              # SQLAlchemy database models (future phases)
│   ├── schemas/             # Pydantic request/response schemas (future phases)
│   ├── services/            # Business logic layer (future phases)
│   ├── repositories/        # Database access layer (future phases)
│   └── websocket/           # WebSocket connection & room manager (future phases)
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Pytest fixtures & TestClient configuration
│   └── test_health.py       # Health check automated tests
├── Dockerfile               # Container definition for backend
├── requirements.txt         # Python package dependencies
└── README.md                # Backend documentation
```
