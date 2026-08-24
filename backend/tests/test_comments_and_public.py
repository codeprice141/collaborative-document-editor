from fastapi.testclient import TestClient


def get_auth_headers(client: TestClient, email: str = "author@example.com"):
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123", "full_name": "Author User"},
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_and_resolve_comments(client: TestClient):
    headers = get_auth_headers(client, "commenter@example.com")

    # Create doc
    doc_res = client.post(
        "/api/v1/documents/",
        json={"title": "Commentable Document", "content": "This is sample text"},
        headers=headers,
    )
    assert doc_res.status_code == 201
    doc_id = doc_res.json()["id"]

    # Create comment
    comment_res = client.post(
        f"/api/v1/documents/{doc_id}/comments",
        json={
            "content": "Please review this phrasing",
            "selected_text": "sample text",
            "anchor_range": "8:19",
        },
        headers=headers,
    )
    assert comment_res.status_code == 201
    comment = comment_res.json()
    assert comment["content"] == "Please review this phrasing"
    assert comment["is_resolved"] is False
    comment_id = comment["id"]

    # Add threaded reply
    reply_res = client.post(
        f"/api/v1/documents/{doc_id}/comments/{comment_id}/replies",
        json={"content": "Looks good to me!"},
        headers=headers,
    )
    assert reply_res.status_code == 201
    assert reply_res.json()["content"] == "Looks good to me!"

    # Resolve comment
    resolve_res = client.patch(
        f"/api/v1/documents/{doc_id}/comments/{comment_id}/resolve?is_resolved=true",
        headers=headers,
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["is_resolved"] is True

    # List comments
    list_res = client.get(f"/api/v1/documents/{doc_id}/comments", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1


def test_public_document_sharing(client: TestClient):
    headers = get_auth_headers(client, "owner_pub@example.com")
    doc_res = client.post(
        "/api/v1/documents/",
        json={"title": "Public Spec Doc", "content": "Open access spec"},
        headers=headers,
    )
    doc_id = doc_res.json()["id"]

    # Toggle public link on
    update_res = client.put(
        f"/api/v1/documents/{doc_id}",
        json={"is_public": True, "public_role": "viewer"},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["is_public"] is True

    # Another user can access it
    other_headers = get_auth_headers(client, "stranger@example.com")
    get_res = client.get(f"/api/v1/documents/{doc_id}", headers=other_headers)
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Public Spec Doc"
