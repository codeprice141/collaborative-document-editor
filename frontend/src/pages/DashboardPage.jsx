import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import ConfirmModal from "../components/ConfirmModal";
import {
  FileText,
  Plus,
  Trash2,
  Users,
  Search,
  Globe,
  Lock,
  Clock,
  FolderOpen
} from "lucide-react";

export default function DashboardPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [deleteDocTarget, setDeleteDocTarget] = useState(null);
  const [creating, setCreating] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleCreateNew = async () => {
    try {
      setCreating(true);
      const newDoc = await api.createDocument("Untitled Document");
      navigate(`/documents/${newDoc.id}`);
    } catch (err) {
      console.error("Failed to create document", err);
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDocTarget) return;
    try {
      await api.deleteDocument(deleteDocTarget.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteDocTarget.id));
      setDeleteDocTarget(null);
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === "owned") return doc.user_role === "owner";
    if (activeFilter === "shared") return doc.user_role !== "owner";
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-primary)" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: "1200px", width: "100%", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Top Header & New Document Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              Workspaces & Documents
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.2rem" }}>
              Collaborate in real time on text documents and interactive whiteboards.
            </p>
          </div>

          <button
            onClick={handleCreateNew}
            disabled={creating}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.7rem 1.25rem",
              backgroundColor: "var(--accent-color)",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "0.9rem",
              cursor: "pointer",
              boxShadow: "0 4px 14px -2px rgba(59, 130, 246, 0.35)"
            }}
          >
            <Plus size={18} />
            <span>{creating ? "Creating..." : "New Document"}</span>
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
          {/* Search Box */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            padding: "0.5rem 0.85rem",
            borderRadius: "10px",
            width: "100%",
            maxWidth: "340px",
            boxShadow: "var(--shadow-sm)"
          }}>
            <Search size={16} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                width: "100%",
                fontSize: "0.875rem"
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{
            display: "flex",
            backgroundColor: "var(--bg-surface)",
            padding: "3px",
            borderRadius: "10px",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-sm)"
          }}>
            {[
              { id: "all", label: "All Docs" },
              { id: "owned", label: "Owned by Me" },
              { id: "shared", label: "Shared with Me" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  padding: "0.35rem 0.85rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: activeFilter === tab.id ? "var(--accent-glow)" : "transparent",
                  color: activeFilter === tab.id ? "var(--accent-color)" : "var(--text-secondary)",
                  fontWeight: activeFilter === tab.id ? "700" : "500",
                  fontSize: "0.8125rem",
                  cursor: "pointer"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-secondary)" }}>
            Loading your workspaces...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "4.5rem 1.5rem",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "18px",
            border: "1px dashed var(--border-color)"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "var(--accent-glow)",
              color: "var(--accent-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem auto"
            }}>
              <FolderOpen size={24} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "0.25rem" }}>
              No documents found
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              {searchQuery ? "No matches for your search term." : "Create your first document to get started!"}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateNew}
                style={{
                  padding: "0.6rem 1.25rem",
                  backgroundColor: "var(--accent-color)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.875rem"
                }}
              >
                Create Document
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.25rem"
          }}>
            {filteredDocuments.map((doc) => {
              const isOwner = doc.user_role === "owner";
              const collabCount = (doc.collaborators?.length || 0) + 1;

              return (
                <div
                  key={doc.id}
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderRadius: "16px",
                    border: "1px solid var(--border-color)",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "var(--shadow-sm)",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  }}
                >
                  <div>
                    {/* Card Top: Badges & Trash */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        {doc.is_public ? (
                          <span style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.2rem",
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            backgroundColor: "#dcfce7",
                            color: "#15803d"
                          }}>
                            <Globe size={11} /> Public
                          </span>
                        ) : (
                          <span style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.2rem",
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            backgroundColor: "var(--bg-primary)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border-color)"
                          }}>
                            <Lock size={11} /> Private
                          </span>
                        )}

                        <span style={{
                          fontSize: "0.7rem",
                          fontWeight: "700",
                          padding: "2px 6px",
                          borderRadius: "6px",
                          backgroundColor: isOwner ? "var(--accent-glow)" : "#fef3c7",
                          color: isOwner ? "var(--accent-color)" : "#92400e"
                        }}>
                          {isOwner ? "Owner" : doc.user_role?.toUpperCase()}
                        </span>
                      </div>

                      {/* Owner-Only Delete Button */}
                      {isOwner && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteDocTarget(doc);
                          }}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: "var(--text-tertiary)",
                            padding: "4px",
                            borderRadius: "6px"
                          }}
                          title="Delete document (Owner only)"
                          onMouseEnter={(e) => e.currentTarget.style.color = "#dc2626"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    {/* Card Title Link */}
                    <Link
                      to={`/documents/${doc.id}`}
                      style={{ textDecoration: "none", color: "inherit", display: "block" }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", marginBottom: "0.6rem" }}>
                        <div style={{
                          padding: "0.5rem",
                          borderRadius: "10px",
                          backgroundColor: "var(--accent-glow)",
                          color: "var(--accent-color)",
                          flexShrink: 0
                        }}>
                          <FileText size={20} />
                        </div>
                        <h2 style={{
                          fontSize: "1.05rem",
                          fontWeight: "700",
                          color: "var(--text-primary)",
                          lineHeight: "1.35",
                          letterSpacing: "-0.01em"
                        }}>
                          {doc.title || "Untitled Document"}
                        </h2>
                      </div>
                    </Link>
                  </div>

                  {/* Card Bottom Meta: Collaborator count & time */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid var(--border-color)",
                    paddingTop: "0.75rem",
                    marginTop: "0.75rem",
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Users size={13} />
                      <span>{collabCount} {collabCount === 1 ? "member" : "members"}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Clock size={12} />
                      <span>{formatRelativeTime(doc.updated_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Strict Owner Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteDocTarget}
        title="Delete Document?"
        message={`Are you sure you want to delete "${deleteDocTarget?.title}"? This action cannot be undone and will remove access for all collaborators.`}
        confirmText="Delete Document"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDocTarget(null)}
      />
    </div>
  );
}
