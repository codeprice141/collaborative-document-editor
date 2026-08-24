from fastapi.testclient import TestClient


def test_root_endpoint(client: TestClient):
    """Verify GET / returns 200 OK and service metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Collaborative Document Editor"
    assert data["status"] == "online"
    assert "docs_url" in data
    assert "health_url" in data


def test_root_health_endpoint(client: TestClient):
    """Verify GET /health returns 200 OK with health status information."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] in ["ok", "degraded"]
    assert data["service"] == "Collaborative Document Editor"
    assert "database" in data
    assert "status" in data["database"]


def test_versioned_health_endpoint(client: TestClient):
    """Verify GET /api/v1/health returns 200 OK."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["service"] == "Collaborative Document Editor"
    assert "database" in data
