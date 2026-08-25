const API_BASE = (function() {
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:8000/api/v1";
  }
  return "/api/v1";
})();

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
  async getOAuthConfig() {
    const res = await fetch(`${API_BASE}/auth/oauth/config`);
    return handleResponse(res, "Failed to get OAuth config");
  },

  async loginWithGoogle(idTokenOrAccessToken) {
    const payload = typeof idTokenOrAccessToken === "string" && idTokenOrAccessToken.startsWith("ey")
      ? { id_token: idTokenOrAccessToken }
      : { access_token: idTokenOrAccessToken };
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse(res, "Google authentication failed");
  },

  async loginWithGitHub(code) {
    const res = await fetch(`${API_BASE}/auth/github`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    return handleResponse(res, "GitHub authentication failed");
  },

  async searchUsers(query = "") {
    const res = await fetch(`${API_BASE}/auth/users?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to search users");
  },

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

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Unauthorized");
  },

  async getDocuments() {
    const res = await fetch(`${API_BASE}/documents`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to load documents");
  },

  async createDocument(title, content = "") {
    const res = await fetch(`${API_BASE}/documents`, {
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

  // --- Comments & Threaded Discussions ---
  async getComments(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}/comments`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to fetch comments");
  },

  async createComment(docId, { content, selected_text, anchor_range }) {
    const res = await fetch(`${API_BASE}/documents/${docId}/comments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, selected_text, anchor_range }),
    });
    return handleResponse(res, "Failed to post comment");
  },

  async resolveComment(docId, commentId, is_resolved = true) {
    const res = await fetch(`${API_BASE}/documents/${docId}/comments/${commentId}/resolve?is_resolved=${is_resolved}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to resolve comment");
  },

  async deleteComment(docId, commentId) {
    const res = await fetch(`${API_BASE}/documents/${docId}/comments/${commentId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok && res.status !== 204) {
      return handleResponse(res, "Failed to delete comment");
    }
    return true;
  },

  async replyComment(docId, commentId, content) {
    const res = await fetch(`${API_BASE}/documents/${docId}/comments/${commentId}/replies`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ content }),
    });
    return handleResponse(res, "Failed to post reply");
  },
};
