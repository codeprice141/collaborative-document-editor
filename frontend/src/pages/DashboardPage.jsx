import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import {
  Plus,
  FileText,
  Clock,
  Search,
  Trash2,
  ShieldCheck,
  Edit3,
  Eye,
  X,
  Sparkles
} from "lucide-react";

export default function DashboardPage() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const loadDocs = async () => {
    try {
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleCreateSubmit = async (e) => {
    if (e) e.preventDefault();
    setCreating(true);
    const titleToSave = newTitle.trim() || "Untitled Document";

    try {
      const newDoc = await api.createDocument(titleToSave, "<p>Start typing here...</p>");
      setShowCreateModal(false);
      setNewTitle("");
      navigate(`/documents/${newDoc.id}`);
    } catch (err) {
      alert("Failed to create document: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e, docId) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await api.deleteDocument(docId);
        loadDocs();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const filtered = documents.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Navbar />

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        {/* Top Header & Search Bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em" }}>
              Documents
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.2rem" }}>
              Manage and collaborate on your team documents
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div style={{ position: "relative", width: "260px" }}>
              <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem 0.55rem 2.2rem",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.875rem",
                  backgroundColor: "#ffffff",
                  outline: "none"
                }}
              />
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              disabled={creating}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.55rem 1.1rem",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontWeight: "600",
                fontSize: "0.875rem",
                cursor: "pointer",
                boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
                transition: "background 0.15s"
              }}
            >
              <Plus size={18} />
              <span>New Document</span>
            </button>
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div style={{ color: "#64748b", fontSize: "0.9rem", padding: "2rem 0" }}>Loading documents...</div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "5rem 1rem",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px dashed #cbd5e1"
          }}>
            <FileText size={48} color="#94a3b8" style={{ marginBottom: "1rem" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#334155" }}>No documents found</h3>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
              Click 'New Document' to start writing together.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {filtered.map((doc) => (
              <Link
                key={doc.id}
                to={`/documents/${doc.id}`}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  textDecoration: "none"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(0,0,0,0.06)";
                  e.currentTarget.style.borderColor = "#93c5fd";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div style={{
                      padding: "0.5rem",
                      borderRadius: "10px",
                      backgroundColor: "#eff6ff",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <FileText size={20} />
                    </div>

                    <span style={{
                      fontSize: "0.75rem",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "9999px",
                      fontWeight: "600",
                      backgroundColor: doc.user_role === "owner" ? "#dbeafe" : doc.user_role === "editor" ? "#dcfce7" : "#f1f5f9",
                      color: doc.user_role === "owner" ? "#1e40af" : doc.user_role === "editor" ? "#166534" : "#475569",
                      textTransform: "capitalize",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem"
                    }}>
                      {doc.user_role === "owner" && <ShieldCheck size={12} />}
                      {doc.user_role === "editor" && <Edit3 size={12} />}
                      {doc.user_role === "viewer" && <Eye size={12} />}
                      {doc.user_role}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.5rem", lineHeight: "1.4" }}>
                    {doc.title}
                  </h3>
                </div>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid #f8fafc",
                  marginTop: "1rem",
                  fontSize: "0.75rem",
                  color: "#94a3b8"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Clock size={12} />
                    <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                  </div>

                  {doc.user_role === "owner" && (
                    <button
                      onClick={(e) => handleDelete(e, doc.id)}
                      style={{
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        color: "#94a3b8",
                        padding: "2px",
                        borderRadius: "4px"
                      }}
                      title="Delete document"
                      onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* New Document Name Modal */}
      {showCreateModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 50, backdropFilter: "blur(4px)", padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "#ffffff", borderRadius: "16px", padding: "1.75rem",
            width: "100%", maxWidth: "440px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles size={20} color="#2563eb" />
                <h3 style={{ fontSize: "1.125rem", fontWeight: "700", color: "#0f172a" }}>Create New Document</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#334155", marginBottom: "0.35rem" }}>
                  Document Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sprint Roadmap, Meeting Notes..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px",
                    border: "1px solid #cbd5e1", fontSize: "0.95rem"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff", color: "#64748b", fontWeight: "500", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: "0.6rem 1.25rem", borderRadius: "8px", border: "none",
                    backgroundColor: "#2563eb", color: "#ffffff", fontWeight: "600", cursor: "pointer"
                  }}
                >
                  {creating ? "Creating..." : "Create Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
