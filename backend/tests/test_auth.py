from fastapi.testclient import TestClient


def test_register_user_success(client: TestClient):
    payload = {
        "email": "testuser@example.com",
        "password": "strongpassword123",
        "full_name": "Test User",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert data["full_name"] == "Test User"
    assert "id" in data
    assert "hashed_password" not in data


def test_register_duplicate_email_fails(client: TestClient):
    payload = {
        "email": "duplicate@example.com",
        "password": "password123",
        "full_name": "User One",
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


def test_login_success_and_get_profile(client: TestClient):
    user_payload = {
        "email": "loginuser@example.com",
        "password": "securepass123",
        "full_name": "Login User",
    }
    client.post("/api/v1/auth/register", json=user_payload)

    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "loginuser@example.com", "password": "securepass123"},
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # Test protected /auth/me
    me_res = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "loginuser@example.com"


def test_login_invalid_password_fails(client: TestClient):
    user_payload = {
        "email": "wrongpass@example.com",
        "password": "correctpassword",
        "full_name": "Wrong Pass User",
    }
    client.post("/api/v1/auth/register", json=user_payload)

    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpass@example.com", "password": "incorrectpassword"},
    )
    assert login_res.status_code == 401
    assert "Incorrect email or password" in login_res.json()["detail"]


def test_protected_route_without_token_fails(client: TestClient):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
