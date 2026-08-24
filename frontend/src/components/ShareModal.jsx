import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { X, UserPlus, Copy, Check, Trash2, Search, UserCheck } from "lucide-react";

export default function ShareModal({ docId, collaborators = [], onClose, onShared }) {
  const { user: currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Search user suggestions
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      api.searchUsers(searchQuery.trim())
        .then((users) => {
          // Exclude current user from suggestions
          setUserSuggestions(users.filter((u) => u.email !== currentUser?.email));
        })
        .catch(() => {});
    } else {
      setUserSuggestions([]);
    }
  }, [searchQuery, currentUser]);

  const handleCopyMyEmail = () => {
    if (currentUser?.email) {
      navigator.clipboard.writeText(currentUser.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.shareDocument(docId, email.trim(), role);
      setSuccess(`Successfully invited ${email} as ${role}!`);
      setEmail("");
      setSearchQuery("");
      setUserSuggestions([]);
      if (onShared) onShared();
    } catch (err) {
      setError(err.message || "Failed to share document");
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

  const selectUserSuggestion = (suggestedEmail) => {
    setEmail(suggestedEmail);
    setSearchQuery(suggestedEmail);
    setUserSuggestions([]);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.6)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 50, backdropFilter: "blur(4px)", padding: "1rem"
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "1.75rem",
        width: "100%",
        maxWidth: "520px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        maxHeight: "90vh",
        overflowY: "auto"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ padding: "0.5rem", borderRadius: "8px", backgroundColor: "#eff6ff", color: "#2563eb" }}>
              <UserPlus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "700", color: "#0f172a" }}>Share Document</h3>
              <p style={{ fontSize: "0.75rem", color: "#64748b" }}>Invite collaborators or share your email ID</p>
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8" }}>
            <X size={20} />
          </button>
        </div>

        {/* Your Identity / Copy Email Banner */}
        <div style={{
          backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px",
          padding: "0.75rem 1rem", marginBottom: "1.25rem", display: "flex",
          justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Email ID</div>
            <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#0f172a" }}>{currentUser?.email}</div>
          </div>
          <button
            onClick={handleCopyMyEmail}
            style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              padding: "0.4rem 0.75rem", borderRadius: "6px",
              border: "1px solid #cbd5e1", backgroundColor: "#ffffff",
              color: copied ? "#16a34a" : "#2563eb", fontSize: "0.8125rem",
              fontWeight: "600", cursor: "pointer"
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? "Copied!" : "Copy Email"}</span>
          </button>
        </div>

        {error && <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "0.6rem", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</div>}
        {success && <div style={{ backgroundColor: "#f0fdf4", color: "#15803d", padding: "0.6rem", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "1rem" }}>{success}</div>}

        {/* Invite Form */}
        <form onSubmit={handleShare} style={{ marginBottom: "1.5rem", position: "relative" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="email"
                placeholder="Search or enter teammate email..."
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSearchQuery(e.target.value);
                }}
                required
                style={{
                  width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px",
                  border: "1px solid #cbd5e1", fontSize: "0.875rem"
                }}
              />
            </div>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                padding: "0.6rem 0.75rem", borderRadius: "8px",
                border: "1px solid #cbd5e1", fontSize: "0.875rem", backgroundColor: "#fff"
              }}
            >
              <option value="editor">Editor (Can edit)</option>
              <option value="viewer">Viewer (Read-only)</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.6rem 1.25rem", backgroundColor: "#2563eb", color: "#fff",
                border: "none", borderRadius: "8px", fontSize: "0.875rem", fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {loading ? "Adding..." : "Invite"}
            </button>
          </div>

          {/* Autocomplete suggestions */}
          {userSuggestions.length > 0 && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0,
              backgroundColor: "#ffffff", borderRadius: "8px",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              border: "1px solid #e2e8f0", zIndex: 20, marginTop: "4px",
              maxHeight: "150px", overflowY: "auto"
            }}>
              {userSuggestions.map((u) => (
                <div
                  key={u.id}
                  onClick={() => selectUserSuggestion(u.email)}
                  style={{
                    padding: "0.5rem 0.75rem", cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    borderBottom: "1px solid #f1f5f9"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
                >
                  <span style={{ fontWeight: "500", fontSize: "0.875rem" }}>{u.full_name}</span>
                  <span style={{ color: "#64748b", fontSize: "0.75rem" }}>{u.email}</span>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Collaborators List */}
        <div>
          <h4 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#64748b", marginBottom: "0.75rem" }}>
            Current Collaborators ({collaborators.length})
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {collaborators.map((c) => (
              <div key={c.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.6rem 0.75rem", borderRadius: "8px", backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    backgroundColor: c.role === "owner" ? "#dbeafe" : "#e0e7ff",
                    color: c.role === "owner" ? "#1e40af" : "#4338ca",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: "700", fontSize: "0.875rem"
                  }}>
                    {c.user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "0.875rem", color: "#0f172a" }}>
                      {c.user.full_name} {c.user.id === currentUser?.id && "(You)"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{c.user.email}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{
                    fontSize: "0.75rem", padding: "0.25rem 0.6rem", borderRadius: "9999px",
                    backgroundColor: c.role === "owner" ? "#dbeafe" : c.role === "editor" ? "#dcfce7" : "#f1f5f9",
                    color: c.role === "owner" ? "#1e40af" : c.role === "editor" ? "#166534" : "#475569",
                    fontWeight: "600", textTransform: "capitalize"
                  }}>
                    {c.role}
                  </span>

                  {c.role !== "owner" && (
                    <button
                      onClick={() => handleRemove(c.user_id)}
                      style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444", padding: "0.25rem" }}
                      title="Remove access"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
