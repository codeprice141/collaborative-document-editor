# System Architecture

## Overview
The Real-Time Collaborative Document Editor is designed as a **modular monolith** that will progressively scale into a distributed architecture with Redis pub/sub and optional microservices.

## Architecture Layers
1. **API & Routing Layer:** FastAPI routers managing REST endpoints and WebSocket room connections.
2. **Business Logic Layer (Services):** Core domain operations (auth, document lifecycle, synchronization).
3. **Data Access Layer (Repositories):** SQLAlchemy ORM models and queries.
4. **Realtime Synchronization Engine:** Conflict resolution (OT/CRDT) and operation broadcast.
5. **Persistence Layer:** PostgreSQL 16 (relational data, users, documents, versions).
6. **Presence & Pub/Sub Layer (Phase 7+):** Redis for live presence and multi-instance broadcast.

## Target Component Diagram (Phase 1)
```
[ Client (Browser / TestClient) ]
               │
               ▼ HTTP / REST
       [ FastAPI Application ]
               │
      [ SQLAlchemy Engine ]
               │
               ▼
     [ PostgreSQL Database ]
```
