const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

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
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Registration failed");
    return data;
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Login failed");
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  },

  async getDocuments() {
    const res = await fetch(`${API_BASE}/documents/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load documents");
    return res.json();
  },

  async createDocument(title, content = "") {
    const res = await fetch(`${API_BASE}/documents/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to create document");
    return data;
  },

  async getDocument(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to load document");
    return data;
  },

  async updateDocument(docId, updateData) {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to update document");
    return data;
  },

  async deleteDocument(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok && res.status !== 204) throw new Error("Failed to delete document");
    return true;
  },

  async shareDocument(docId, email, role = "editor") {
    const res = await fetch(`${API_BASE}/documents/${docId}/share`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to share document");
    return data;
  },

  async removeCollaborator(docId, userId) {
    const res = await fetch(`${API_BASE}/documents/${docId}/collaborators/${userId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok && res.status !== 204) throw new Error("Failed to remove collaborator");
    return true;
  },

  async createSnapshot(docId, comment) {
    const res = await fetch(`${API_BASE}/documents/${docId}/snapshots`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ comment }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to create snapshot");
    return data;
  },

  async getRevisions(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}/revisions`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch revisions");
    return res.json();
  },

  async rollbackSnapshot(docId, snapshotId) {
    const res = await fetch(`${API_BASE}/documents/${docId}/rollback/${snapshotId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to restore version");
    return data;
  },
};
