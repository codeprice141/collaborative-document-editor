from fastapi.testclient import TestClient


def register_and_get_token(client: TestClient, email: str, name: str) -> str:
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123", "full_name": name},
    )
    res = client.post(
        "/api/v1/auth/login", json={"email": email, "password": "password123"}
    )
    return res.json()["access_token"]


def test_websocket_sync_init_and_ping(client: TestClient):
    token = register_and_get_token(client, "ws_user@example.com", "WS User")
    headers = {"Authorization": f"Bearer {token}"}

    # Create document
    create_res = client.post(
        "/api/v1/documents",
        json={"title": "WebSocket Live Doc", "content": "Welcome to live editing!"},
        headers=headers,
    )
    doc_id = create_res.json()["id"]

    # Connect WebSocket
    with client.websocket_connect(f"/api/v1/ws/documents/{doc_id}?token={token}") as ws:
        # Receive sync_init
        init_data = ws.receive_json()
        assert init_data["type"] == "sync_init"
        assert init_data["document_id"] == doc_id
        assert init_data["content"] == "Welcome to live editing!"
        assert init_data["user_role"] == "owner"

        # Send ping
        ws.send_json({"type": "ping"})
        pong_data = ws.receive_json()
        assert pong_data["type"] == "pong"


def test_websocket_realtime_operations_and_draw(client: TestClient):
    token = register_and_get_token(client, "ws_op_user@example.com", "OP User")
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/documents",
        json={"title": "Collab Live Op", "content": "Hello"},
        headers=headers,
    )
    doc_id = create_res.json()["id"]

    with client.websocket_connect(f"/api/v1/ws/documents/{doc_id}?token={token}&client_id=client_op") as ws:
        init_data = ws.receive_json()
        assert init_data["type"] == "sync_init"

        # Send an operation: insert " World" at position 5
        ws.send_json({
            "type": "operation",
            "operation": {
                "op_type": "insert",
                "position": 5,
                "text": " World",
                "client_version": 0
            }
        })

        ack = ws.receive_json()
        assert ack["type"] == "operation_ack"
        assert ack["server_version"] == 1

        # Send draw event
        ws.send_json({
            "type": "draw",
            "elements": [{"tool": "rect", "x1": 10, "y1": 10, "x2": 50, "y2": 50}]
        })
