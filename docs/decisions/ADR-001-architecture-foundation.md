# ADR-001: Architecture Foundation and Modular Monolith

## Status
Accepted

## Context
We are building a real-time collaborative document editor. A critical early risk is premature complexity (microservices, distributed caches, multiple datastores) before fundamental features and real-time synchronization are validated.

## Decision
1. We will adopt a **Modular Monolith** structure in FastAPI.
2. The backend application will reside in `backend/app/` partitioned into `api/`, `core/`, `models/`, `schemas/`, `services/`, `repositories/`, and `websocket/`.
3. PostgreSQL is selected as the primary relational database with SQLAlchemy 2.0.
4. Redis and distributed pub/sub will be introduced in Phase 10 only after single-node collaboration and synchronization (Phases 5–8) are stable and fully tested.

## Consequences
- Fast developer iteration and unified testing.
- Simple local setup with a single Docker Compose PostgreSQL service.
- Easy transition to horizontal scaling and optional microservices later if capacity demands it.
