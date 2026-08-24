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
        "/api/v1/documents/",
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


def test_websocket_realtime_collaboration_between_two_users(client: TestClient):
    token_owner = register_and_get_token(client, "ws_owner@example.com", "Owner")
    token_editor = register_and_get_token(client, "ws_editor@example.com", "Editor")

    h_owner = {"Authorization": f"Bearer {token_owner}"}
    create_res = client.post(
        "/api/v1/documents/",
        json={"title": "Collab Live", "content": "Hello"},
        headers=h_owner,
    )
    doc_id = create_res.json()["id"]

    # Share with editor
    client.post(
        f"/api/v1/documents/{doc_id}/share",
        json={"email": "ws_editor@example.com", "role": "editor"},
        headers=h_owner,
    )

    # Open WebSocket 1 (Owner)
    with client.websocket_connect(f"/api/v1/ws/documents/{doc_id}?token={token_owner}&client_id=client_owner") as ws_owner:
        init_owner = ws_owner.receive_json()
        assert init_owner["type"] == "sync_init"

        # Open WebSocket 2 (Editor)
        with client.websocket_connect(f"/api/v1/ws/documents/{doc_id}?token={token_editor}&client_id=client_editor") as ws_editor:
            init_editor = ws_editor.receive_json()
            assert init_editor["type"] == "sync_init"

            # Owner receives presence_join
            join_event = ws_owner.receive_json()
            assert join_event["type"] == "presence_join"

            # Editor sends an operation: insert " World" at position 5
            ws_editor.send_json({
                "type": "operation",
                "operation": {
                    "op_type": "insert",
                    "position": 5,
                    "text": " World",
                    "client_version": 0
                }
            })

            # Editor receives operation_ack
            ack = ws_editor.receive_json()
            assert ack["type"] == "operation_ack"
            assert ack["server_version"] == 1

            # Owner receives broadcast
            broadcast = ws_owner.receive_json()
            assert broadcast["type"] == "operation_broadcast"
            assert broadcast["operation"]["text"] == " World"
            assert broadcast["version"] == 1
