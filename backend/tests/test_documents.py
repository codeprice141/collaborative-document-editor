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


def test_create_and_get_document(client: TestClient):
    token = register_and_get_token(client, "author@example.com", "Author User")
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/documents/",
        json={"title": "Design Specs", "content": "Initial specification draft."},
        headers=headers,
    )
    assert create_res.status_code == 201
    doc = create_res.json()
    assert doc["title"] == "Design Specs"
    assert doc["content"] == "Initial specification draft."
    assert doc["user_role"] == "owner"
    doc_id = doc["id"]

    # Get single document
    get_res = client.get(f"/api/v1/documents/{doc_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == doc_id


def test_document_listing_and_permissions(client: TestClient):
    token_owner = register_and_get_token(client, "owner@example.com", "Owner")
    token_collab = register_and_get_token(client, "collab@example.com", "Collaborator")
    token_stranger = register_and_get_token(client, "stranger@example.com", "Stranger")

    h_owner = {"Authorization": f"Bearer {token_owner}"}
    h_collab = {"Authorization": f"Bearer {token_collab}"}
    h_stranger = {"Authorization": f"Bearer {token_stranger}"}

    # Owner creates document
    create_res = client.post(
        "/api/v1/documents/",
        json={"title": "Tribe Secrets", "content": "Fire is warm."},
        headers=h_owner,
    )
    doc_id = create_res.json()["id"]

    # Stranger tries to read -> 404 access denied
    stranger_res = client.get(f"/api/v1/documents/{doc_id}", headers=h_stranger)
    assert stranger_res.status_code == 404

    # Owner shares with collaborator as VIEWER
    share_res = client.post(
        f"/api/v1/documents/{doc_id}/share",
        json={"email": "collab@example.com", "role": "viewer"},
        headers=h_owner,
    )
    assert share_res.status_code == 200

    # Collaborator reads document
    collab_get = client.get(f"/api/v1/documents/{doc_id}", headers=h_collab)
    assert collab_get.status_code == 200
    assert collab_get.json()["user_role"] == "viewer"

    # Viewer tries to edit -> 403 Forbidden
    edit_res = client.put(
        f"/api/v1/documents/{doc_id}",
        json={"content": "Modified by viewer"},
        headers=h_collab,
    )
    assert edit_res.status_code == 403

    # Upgrade collaborator to EDITOR
    client.post(
        f"/api/v1/documents/{doc_id}/share",
        json={"email": "collab@example.com", "role": "editor"},
        headers=h_owner,
    )

    # Editor updates document -> 200 OK
    edit_res2 = client.put(
        f"/api/v1/documents/{doc_id}",
        json={"title": "Updated Tribe Secrets", "content": "Fire and meat are warm."},
        headers=h_collab,
    )
    assert edit_res2.status_code == 200
    assert edit_res2.json()["title"] == "Updated Tribe Secrets"


def test_delete_document_owner_only(client: TestClient):
    token_owner = register_and_get_token(client, "del_owner@example.com", "Delete Owner")
    token_editor = register_and_get_token(client, "del_editor@example.com", "Delete Editor")

    h_owner = {"Authorization": f"Bearer {token_owner}"}
    h_editor = {"Authorization": f"Bearer {token_editor}"}

    create_res = client.post(
        "/api/v1/documents/",
        json={"title": "Temporary Doc", "content": "To be deleted."},
        headers=h_owner,
    )
    doc_id = create_res.json()["id"]

    # Share with editor
    client.post(
        f"/api/v1/documents/{doc_id}/share",
        json={"email": "del_editor@example.com", "role": "editor"},
        headers=h_owner,
    )

    # Editor tries to delete -> 403
    del_fail = client.delete(f"/api/v1/documents/{doc_id}", headers=h_editor)
    assert del_fail.status_code == 403

    # Owner deletes -> 204 No Content
    del_ok = client.delete(f"/api/v1/documents/{doc_id}", headers=h_owner)
    assert del_ok.status_code == 204
