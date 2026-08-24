import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  UserPlus,
  X,
  Trash2,
  Copy,
  Check,
  Globe,
  Lock
} from "lucide-react";

export default function ShareModal({
  docId,
  isPublic = false,
  publicRole = "viewer",
  collaborators = [],
  onClose,
  onShared
}) {
  const { user: currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [publicActive, setPublicActive] = useState(isPublic);
  const [activePublicRole, setActivePublicRole] = useState(publicRole || "viewer");

  const [userSuggestions, setUserSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        try {
          const results = await api.searchUsers(searchQuery);
          setUserSuggestions(results.filter((u) => u.id !== currentUser?.id));
        } catch (e) {}
      } else {
        setUserSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(searchTimer);
  }, [searchQuery, currentUser?.id]);

  const handleShare = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

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

  const handleTogglePublicLink = async (enable) => {
    try {
      await api.updateDocument(docId, {
        is_public: enable,
        public_role: activePublicRole,
      });
      setPublicActive(enable);
      if (onShared) onShared();
    } catch (err) {
      setError("Failed to update link sharing settings");
    }
  };

  const handlePublicRoleChange = async (newRole) => {
    setActivePublicRole(newRole);
    if (publicActive) {
      try {
        await api.updateDocument(docId, {
          public_role: newRole,
        });
        if (onShared) onShared();
      } catch (err) {
        setError("Failed to update public role");
      }
    }
  };

  const handleCopyPublicLink = () => {
    const link = `${window.location.origin}/documents/${docId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRemove = async (userId) => {
    try {
      await api.removeCollaborator(docId, userId);
      if (onShared) onShared();
    } catch (err) {
      setError(err.message || "Failed to remove collaborator");
    }
  };

  const selectUserSuggestion = (userEmail) => {
    setEmail(userEmail);
    setSearchQuery("");
    setUserSuggestions([]);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(8px)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 100, padding: "1rem"
    }}>
      <div style={{
        backgroundColor: "var(--bg-surface)",
        borderRadius: "16px", padding: "1.75rem",
        width: "100%", maxWidth: "520px",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        border: "1px solid var(--border-color)",
        maxHeight: "90vh", overflowY: "auto"
      }}>
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ padding: "0.5rem", borderRadius: "10px", backgroundColor: "#eff6ff", color: "#2563eb" }}>
              <UserPlus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)" }}>Share Document</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Manage access, public link and collaborator roles</p>
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
            <X size={20} />
          </button>
        </div>

        {/* Public Share Link Card */}
        <div style={{
          backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "12px",
          padding: "1rem", marginBottom: "1.25rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {publicActive ? <Globe size={18} color="#16a34a" /> : <Lock size={18} color="var(--text-secondary)" />}
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--text-primary)" }}>
                  {publicActive ? "Public Link Active" : "Restricted Access"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  {publicActive ? "Anyone with this link can access" : "Only invited collaborators can access"}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleTogglePublicLink(!publicActive)}
              style={{
                padding: "0.35rem 0.75rem", borderRadius: "6px",
                border: "1px solid var(--border-color)",
                backgroundColor: publicActive ? "#dcfce7" : "var(--bg-surface)",
                color: publicActive ? "#166534" : "var(--text-primary)", fontSize: "0.75rem", fontWeight: "700",
                cursor: "pointer"
              }}
            >
              {publicActive ? "Public Enabled ✓" : "Enable Public Link"}
            </button>
          </div>

          {publicActive && (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem", flexWrap: "wrap" }}>
              <select
                value={activePublicRole}
                onChange={(e) => handlePublicRoleChange(e.target.value)}
                style={{
                  padding: "0.45rem 0.75rem", borderRadius: "8px",
                  fontSize: "0.8125rem", fontWeight: "600",
                  backgroundColor: "var(--bg-surface)", color: "var(--text-primary)",
                  border: "1px solid var(--border-color)", outline: "none", cursor: "pointer"
                }}
              >
                <option value="viewer">Can View (Read-only)</option>
                <option value="editor">Can Edit (Collaborator)</option>
              </select>

              <button
                onClick={handleCopyPublicLink}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
                  padding: "0.45rem 0.75rem", borderRadius: "8px", border: "none",
                  backgroundColor: copiedLink ? "#16a34a" : "#2563eb",
                  color: "#ffffff", fontSize: "0.8125rem", fontWeight: "600",
                  cursor: "pointer", minWidth: "160px"
                }}
              >
                {copiedLink ? <Check size={15} /> : <Copy size={15} />}
                <span>{copiedLink ? "Link Copied to Clipboard!" : "Copy Public Link"}</span>
              </button>
            </div>
          )}
        </div>

        {error && <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "0.6rem", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "1rem", border: "1px solid #fecaca" }}>{error}</div>}
        {success && <div style={{ backgroundColor: "#f0fdf4", color: "#15803d", padding: "0.6rem", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "1rem", border: "1px solid #bbf7d0" }}>{success}</div>}

        {/* Invite Form */}
        <form onSubmit={handleShare} style={{ marginBottom: "1.5rem", position: "relative" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 200px" }}>
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
                  width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px",
                  fontSize: "0.875rem", outline: "none"
                }}
              />
            </div>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                padding: "0.55rem 0.75rem", borderRadius: "8px",
                fontSize: "0.875rem", fontWeight: "600", cursor: "pointer",
                backgroundColor: "var(--bg-surface)", color: "var(--text-primary)",
                border: "1px solid var(--border-color)"
              }}
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.55rem 1.1rem", backgroundColor: "#2563eb", color: "#fff",
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
              backgroundColor: "var(--bg-surface)", borderRadius: "8px",
              boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
              border: "1px solid var(--border-color)", zIndex: 20, marginTop: "4px",
              maxHeight: "150px", overflowY: "auto"
            }}>
              {userSuggestions.map((u) => (
                <div
                  key={u.id}
                  onClick={() => selectUserSuggestion(u.email)}
                  style={{
                    padding: "0.5rem 0.75rem", cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    borderBottom: "1px solid var(--border-color)"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-primary)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <span style={{ fontWeight: "600", fontSize: "0.875rem", color: "var(--text-primary)" }}>{u.full_name}</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>{u.email}</span>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Collaborators List */}
        <div>
          <h4 style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "0.75rem" }}>
            Collaborators ({collaborators.length})
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {collaborators.map((c) => (
              <div key={c.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.6rem 0.75rem", borderRadius: "10px", backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-color)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    backgroundColor: c.role === "owner" ? "#dbeafe" : "#e0e7ff",
                    color: c.role === "owner" ? "#1e40af" : "#4338ca",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: "700", fontSize: "0.8125rem"
                  }}>
                    {c.user?.full_name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                      {c.user?.full_name} {c.user?.id === currentUser?.id && "(You)"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{c.user?.email}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{
                    fontSize: "0.75rem", padding: "0.2rem 0.55rem", borderRadius: "9999px",
                    backgroundColor: c.role === "owner" ? "#dbeafe" : c.role === "editor" ? "#dcfce7" : "#f1f5f9",
                    color: c.role === "owner" ? "#1e40af" : c.role === "editor" ? "#166534" : "#475569",
                    fontWeight: "700", textTransform: "capitalize"
                  }}>
                    {c.role}
                  </span>

                  {c.role !== "owner" && (
                    <button
                      onClick={() => handleRemove(c.user_id)}
                      style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444", padding: "0.25rem" }}
                      title="Remove access"
                    >
                      <Trash2 size={15} />
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
