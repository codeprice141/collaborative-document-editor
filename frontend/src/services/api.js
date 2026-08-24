const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res, defaultErrorMsg = "Request failed") {
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { detail: text || defaultErrorMsg };
  }
  if (!res.ok) {
    throw new Error(data.detail || defaultErrorMsg);
  }
  return data;
}

export const api = {
  async register(email, password, full_name) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name }),
    });
    return handleResponse(res, "Registration failed");
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res, "Login failed");
  },


  async searchUsers(query = "") {
    const res = await fetch(`${API_BASE}/auth/users?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to search users");
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Unauthorized");
  },

  async getDocuments() {
    const res = await fetch(`${API_BASE}/documents/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to load documents");
  },

  async createDocument(title, content = "") {
    const res = await fetch(`${API_BASE}/documents/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, content }),
    });
    return handleResponse(res, "Failed to create document");
  },

  async getDocument(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to load document");
  },

  async updateDocument(docId, updateData) {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });
    return handleResponse(res, "Failed to update document");
  },

  async deleteDocument(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok && res.status !== 204) {
      return handleResponse(res, "Failed to delete document");
    }
    return true;
  },

  async shareDocument(docId, email, role = "editor") {
    const res = await fetch(`${API_BASE}/documents/${docId}/share`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, role }),
    });
    return handleResponse(res, "Failed to share document");
  },

  async removeCollaborator(docId, userId) {
    const res = await fetch(`${API_BASE}/documents/${docId}/collaborators/${userId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok && res.status !== 204) {
      return handleResponse(res, "Failed to remove collaborator");
    }
    return true;
  },

  async createSnapshot(docId, comment) {
    const res = await fetch(`${API_BASE}/documents/${docId}/snapshots`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ comment }),
    });
    return handleResponse(res, "Failed to create snapshot");
  },

  async getRevisions(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}/revisions`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to fetch revisions");
  },

  async rollbackSnapshot(docId, snapshotId) {
    const res = await fetch(`${API_BASE}/documents/${docId}/rollback/${snapshotId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to restore version");
  },
};
