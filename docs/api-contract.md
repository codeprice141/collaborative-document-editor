# API Contract

## Version 1 Base Path
`http://localhost:8000/api/v1`

---

## Endpoints

### 1. Root Service Information
- **URL:** `GET /`
- **Description:** Returns basic service identification and links.
- **Response 200 OK:**
```json
{
  "service": "Collaborative Document Editor",
  "version": "0.1.0",
  "status": "online",
  "docs_url": "/api/v1/docs",
  "health_url": "/health"
}
```

### 2. Service & Database Health Check
- **URL:** `GET /health` or `GET /api/v1/health`
- **Description:** Returns system health and database connectivity latency.
- **Response 200 OK (Healthy):**
```json
{
  "status": "ok",
  "service": "Collaborative Document Editor",
  "version": "0.1.0",
  "environment": "development",
  "database": {
    "status": "connected",
    "latency_ms": 1.25
  }
}
```
- **Response 200 OK (Degraded / DB offline):**
```json
{
  "status": "degraded",
  "service": "Collaborative Document Editor",
  "version": "0.1.0",
  "environment": "development",
  "database": {
    "status": "disconnected",
    "error": "connection error details..."
  }
}
```
