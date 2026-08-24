from fastapi.testclient import TestClient


def test_snapshots_and_rollback(client: TestClient):
    # Register & Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "snapshot@example.com", "password": "password123", "full_name": "Snap User"},
    )
    res = client.post(
        "/api/v1/auth/login", json={"email": "snapshot@example.com", "password": "password123"}
    )
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create document
    create_res = client.post(
        "/api/v1/documents/",
        json={"title": "Snapshot Test", "content": "Version 1 content."},
        headers=headers,
    )
    doc_id = create_res.json()["id"]

    # Create snapshot checkpoint
    snap_res = client.post(
        f"/api/v1/documents/{doc_id}/snapshots",
        json={"comment": "Stable v1"},
        headers=headers,
    )
    assert snap_res.status_code == 201
    snap_id = snap_res.json()["id"]

    # Edit document
    client.put(
        f"/api/v1/documents/{doc_id}",
        json={"content": "Version 2 modified content."},
        headers=headers,
    )

    # Check updated content
    get_res = client.get(f"/api/v1/documents/{doc_id}", headers=headers)
    assert get_res.json()["content"] == "Version 2 modified content."

    # List revisions
    rev_list = client.get(f"/api/v1/documents/{doc_id}/revisions", headers=headers)
    assert rev_list.status_code == 200
    assert len(rev_list.json()) >= 2

    # Rollback to v1 snapshot
    rb_res = client.post(
        f"/api/v1/documents/{doc_id}/rollback/{snap_id}", headers=headers
    )
    assert rb_res.status_code == 200
    assert rb_res.json()["content"] == "Version 1 content."
