# 🎨 Member 2 (Frontend) Complete Guide & Handoff

Welcome, Member 2! The entire backend, real-time sync engine, WebSocket rooms, PostgreSQL database, and security layers have been built, verified, and benchmarked by Member 1.

---

## ⚡ 1. How to Run Backend Locally
Make sure PostgreSQL is running:
```bash
docker start collaborative_doc_postgres
# or: docker compose up -d
```
Run the FastAPI backend server:
```bash
cd collaborative-document-editor
bash scripts/run_dev.sh
```
Check Interactive API Swagger Docs: 👉 [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)

---

## 🚀 2. Frontend Technology Recommendations
- **Build Tool:** Vite + React (TypeScript or JavaScript)
- **Styling:** Tailwind CSS + Lucide Icons (or standard CSS)
- **Routing:** React Router v6 (`react-router-dom`)
- **State Management:** Zustand or React Context + Hooks
- **Editor Engine:** TipTap / ProseMirror (`@tiptap/react` `@tiptap/starter-kit`) or Slate / Monaco / Quill
- **HTTP Client:** Axios or native `fetch`

---

## 🧭 3. Target Frontend Pages & Routes

| Route | Page Component | Purpose |
| :--- | :--- | :--- |
| `/login` | `LoginPage` | Email/password login form -> saves JWT token to `localStorage` |
| `/register` | `RegisterPage` | Registration form -> redirects to login or auto-logs in |
| `/dashboard` | `DashboardPage` | Lists all documents, "Create New Document" button, delete modal |
| `/documents/:id` | `EditorPage` | Real-time collaborative editor with live cursors, active users, share modal, revision history |

---

## 🔌 4. Ready-to-Use Frontend Code Snippets

### A. API Client (`src/services/api.js` or `.ts`)
```javascript
const API_BASE = "http://localhost:8000/api/v1";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  async register(email, password, full_name) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name }),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Registration failed");
    return res.json();
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Login failed");
    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  async getDocuments() {
    const res = await fetch(`${API_BASE}/documents/`, { headers: getAuthHeaders() });
    return res.json();
  },

  async createDocument(title, content = "") {
    const res = await fetch(`${API_BASE}/documents/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, content }),
    });
    return res.json();
  },

  async getDocument(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async shareDocument(docId, email, role = "editor") {
    const res = await fetch(`${API_BASE}/documents/${docId}/share`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, role }),
    });
    return res.json();
  },

  async getRevisions(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}/revisions`, { headers: getAuthHeaders() });
    return res.json();
  },

  async rollbackSnapshot(docId, snapshotId) {
    const res = await fetch(`${API_BASE}/documents/${docId}/rollback/${snapshotId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return res.json();
  }
};
```

---

### B. Custom Real-Time Collaboration Hook (`src/hooks/useCollaboration.js`)
```javascript
import { useEffect, useRef, useState, useCallback } from "react";

export function useCollaboration(docId) {
  const [content, setContent] = useState("");
  const [version, setVersion] = useState(0);
  const [activeUsers, setActiveUsers] = useState([]);
  const [userRole, setUserRole] = useState("editor");
  const [myColor, setMyColor] = useState("#FF5722");
  const [remoteCursors, setRemoteCursors] = useState({});
  const wsRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !docId) return;

    const clientId = "client_" + Math.random().toString(36).substring(2, 8);
    const wsUrl = `ws://localhost:8000/api/v1/ws/documents/${docId}?token=${token}&client_id=${clientId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => console.log("WebSocket connected to doc", docId);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "sync_init":
          setContent(data.content);
          setVersion(data.version);
          setUserRole(data.user_role);
          setMyColor(data.user_color);
          setActiveUsers(data.active_users || []);
          break;

        case "operation_broadcast":
          const op = data.operation;
          setContent((prev) => {
            if (op.op_type === "insert") {
              const pos = Math.max(0, Math.min(op.position, prev.length));
              return prev.slice(0, pos) + op.text + prev.slice(pos);
            } else if (op.op_type === "delete") {
              const pos = Math.max(0, Math.min(op.position, prev.length));
              return prev.slice(0, pos) + prev.slice(pos + op.length);
            }
            return prev;
          });
          setVersion(data.version);
          break;

        case "operation_ack":
          setVersion(data.server_version);
          break;

        case "presence_join":
        case "presence_leave":
          setActiveUsers(data.active_users || []);
          break;

        case "cursor_update":
          setRemoteCursors((prev) => ({
            ...prev,
            [data.client_id]: {
              userId: data.user_id,
              cursor: data.cursor,
              selection: data.selection,
              isTyping: data.is_typing,
            },
          }));
          break;
      }
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = () => console.log("WebSocket disconnected.");

    return () => {
      ws.close();
    };
  }, [docId]);

  // Send local insert
  const sendInsert = useCallback(
    (position, text) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "operation",
            operation: {
              op_type: "insert",
              position,
              text,
              client_version: version,
            },
          })
        );
      }
    },
    [version]
  );

  // Send local delete
  const sendDelete = useCallback(
    (position, length) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "operation",
            operation: {
              op_type: "delete",
              position,
              length,
              client_version: version,
            },
          })
        );
      }
    },
    [version]
  );

  // Send cursor movement
  const sendCursor = useCallback((index, isTyping = false) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "cursor",
          cursor: { index },
          is_typing: isTyping,
        })
      );
    }
  }, []);

  return {
    content,
    version,
    userRole,
    myColor,
    activeUsers,
    remoteCursors,
    sendInsert,
    sendDelete,
    sendCursor,
  };
}
```

---

## 📋 5. Member 2 Step-by-Step Task Checklist

- [ ] **Step 1: Frontend Setup**
  - Initialize React app with Vite: `npm create vite@latest frontend -- --template react` (or `react-ts`)
  - Install dependencies: `npm install react-router-dom lucide-react`
- [ ] **Step 2: Authentication UI**
  - Create `LoginPage` & `RegisterPage` with form validation.
  - Store JWT token and user info upon login.
  - Create `ProtectedRoute` wrapper for authenticated routes.
- [ ] **Step 3: Dashboard UI**
  - Fetch documents via `GET /api/v1/documents/`.
  - Render card grid with title, updated date, user role badge (Owner / Editor / Viewer).
  - Add "New Document" modal.
- [ ] **Step 4: Editor & Real-Time Collaboration**
  - Integrate `useCollaboration` hook into `EditorPage`.
  - Render active collaborator avatars with their assigned hex colors.
  - Render remote collaborator cursors and typing indicator badges.
- [ ] **Step 5: Document Sharing & Permissions**
  - Add "Share" button opening modal to invite collaborator by email with Editor/Viewer dropdown.
  - Disable editing textarea/contenteditable if `userRole === viewer`.
- [ ] **Step 6: Revision History UI**
  - Add "History" slide-over drawer listing all snapshots.
  - Add "Restore this version" button calling `POST /documents/:id/rollback/:snapId`.
