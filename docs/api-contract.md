# REST API Contract Specification

**Base URL:** `http://localhost:8000/api/v1`

---

## 🔐 1. Authentication Endpoints

### Register User
- **POST** `/auth/register`
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe"
}
```
- **Response 201 Created:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_active": true,
  "created_at": "2026-08-25T00:00:00Z"
}
```

### Login User
- **POST** `/auth/login`
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response 200 OK:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "is_active": true,
    "created_at": "2026-08-25T00:00:00Z"
  }
}
```

### Get My Profile
- **GET** `/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response 200 OK:** `UserResponse`

---

## 📄 2. Document Endpoints

### Create Document
- **POST** `/documents/`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "title": "Quarterly Strategy",
  "content": "Initial notes..."
}
```
- **Response 201 Created:** Full Document Detail Object.

### List User Documents
- **GET** `/documents/`
- **Headers:** `Authorization: Bearer <token>`
- **Response 200 OK:**
```json
[
  {
    "id": 1,
    "title": "Quarterly Strategy",
    "version": 4,
    "owner_id": 1,
    "is_archived": false,
    "created_at": "2026-08-25T00:00:00Z",
    "updated_at": "2026-08-25T00:05:00Z",
    "user_role": "owner"
  }
]
```

### Get Single Document
- **GET** `/documents/{id}`
- **Headers:** `Authorization: Bearer <token>`
- **Response 200 OK:**
```json
{
  "id": 1,
  "title": "Quarterly Strategy",
  "content": "Initial notes...",
  "version": 4,
  "owner_id": 1,
  "is_archived": false,
  "created_at": "2026-08-25T00:00:00Z",
  "updated_at": "2026-08-25T00:05:00Z",
  "user_role": "owner",
  "owner": { "id": 1, "email": "user@example.com", "full_name": "John Doe" },
  "collaborators": [
    {
      "id": 1,
      "user_id": 2,
      "role": "editor",
      "created_at": "2026-08-25T00:01:00Z",
      "user": { "id": 2, "email": "bob@example.com", "full_name": "Bob" }
    }
  ]
}
```

### Update Document (REST Fallback)
- **PUT** `/documents/{id}`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** `{ "title": "New Title", "content": "New text" }`
- **Response 200 OK:** Updated Document summary.

### Delete Document (Owner only)
- **DELETE** `/documents/{id}`
- **Headers:** `Authorization: Bearer <token>`
- **Response 204 No Content**

### Share Document
- **POST** `/documents/{id}/share`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** `{ "email": "bob@example.com", "role": "editor" }`
- **Response 200 OK:** Collaborator object.

### Remove Collaborator
- **DELETE** `/documents/{id}/collaborators/{user_id}`
- **Response 204 No Content**

---

## 🕒 3. Snapshot & Revision History Endpoints

### Create Snapshot Checkpoint
- **POST** `/documents/{id}/snapshots`
- **Request Body:** `{ "comment": "Release candidate v1" }`
- **Response 201 Created**

### List Document Revisions
- **GET** `/documents/{id}/revisions`
- **Response 200 OK:** Array of snapshots.

### Restore / Rollback Snapshot
- **POST** `/documents/{id}/rollback/{snapshot_id}`
- **Response 200 OK:** Restored document object.
