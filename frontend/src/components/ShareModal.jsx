import React, { useState } from "react";
import { api } from "../services/api";
import { X, UserPlus, Check, Trash2, Shield } from "lucide-react";

export default function ShareModal({ docId, collaborators = [], onClose, onShared }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.shareDocument(docId, email.trim(), role);
      setSuccess(`Shared with ${email} as ${role}!`);
      setEmail("");
      if (onShared) onShared();
    } catch (err) {
      setError(err.message || "Failed to share");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    try {
      await api.removeCollaborator(docId, userId);
      if (onShared) onShared();
    } catch (err) {
      setError(err.message || "Failed to remove collaborator");
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.6)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 50, backdropFilter: "blur(4px)"
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "1.5rem",
        width: "100%",
        maxWidth: "480px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UserPlus size={20} color="#2563eb" />
            <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1e293b" }}>Share Document</h3>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}>
            <X size={20} />
          </button>
        </div>

        {error && <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "0.5rem", borderRadius: "6px", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{error}</div>}
        {success && <div style={{ backgroundColor: "#f0fdf4", color: "#15803d", padding: "0.5rem", borderRadius: "6px", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{success}</div>}

        <form onSubmit={handleShare} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <input
            type="email"
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              flex: 1, padding: "0.5rem 0.75rem", borderRadius: "6px",
              border: "1px solid #cbd5e1", fontSize: "0.875rem"
            }}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem", borderRadius: "6px",
              border: "1px solid #cbd5e1", fontSize: "0.875rem", backgroundColor: "#fff"
            }}
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.5rem 1rem", backgroundColor: "#2563eb", color: "#fff",
              border: "none", borderRadius: "6px", fontSize: "0.875rem", fontWeight: "500",
              cursor: "pointer"
            }}
          >
            {loading ? "Adding..." : "Invite"}
          </button>
        </form>

        <h4 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#64748b", marginBottom: "0.75rem" }}>People with access</h4>
        <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {collaborators.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", borderRadius: "6px", backgroundColor: "#f8fafc" }}>
              <div>
                <div style={{ fontWeight: "500", fontSize: "0.875rem" }}>{c.user.full_name}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{c.user.email}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "4px", backgroundColor: "#e2e8f0", textTransform: "capitalize" }}>
                  {c.role}
                </span>
                {c.role !== "owner" && (
                  <button onClick={() => handleRemove(c.user_id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
