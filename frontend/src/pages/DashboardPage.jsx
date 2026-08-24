import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import ConfirmModal from "../components/ConfirmModal";
import PromptModal from "../components/PromptModal";
import {
  Plus,
  FileText,
  Clock,
  Trash2,
  Lock,
  Globe,
  Share2,
  FolderOpen
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  const fetchDocs = async () => {
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
    fetchDocs();
  }, []);

  const handleCreateDocument = async (title) => {
    if (!title || !title.trim()) return;
    try {
      const newDoc = await api.createDocument(title.trim(), "<p>Start typing your document...</p>");
      navigate(`/documents/${newDoc.id}`);
    } catch (err) {
      console.error("Failed to create doc", err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    try {
      await api.deleteDocument(docToDelete.id);
      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
      setDocToDelete(null);
    } catch (err) {
      console.error("Failed to delete doc", err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ maxWidth: "1100px", width: "100%", margin: "0 auto", padding: "1.5rem 1.25rem", flex: 1 }}>
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-primary)" }}>
              Welcome back, {user?.full_name?.split(" ")[0]} 👋
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Create, collaborate, and brainstorm in real-time
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.6rem 1.1rem",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "0.875rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
            }}
          >
            <Plus size={17} />
            <span>New Document</span>
          </button>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>
            Loading your documents...
          </div>
        ) : documents.length === 0 ? (
          <div style={{
            backgroundColor: "var(--bg-surface)",
            borderRadius: "16px",
            border: "1px dashed var(--border-color)",
            padding: "4rem 2rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem"
          }}>
            <div style={{ padding: "1rem", borderRadius: "50%", backgroundColor: "var(--bg-primary)", color: "#2563eb" }}>
              <FolderOpen size={36} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "700", color: "var(--text-primary)" }}>No documents yet</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Create your first document to start writing and collaborating!
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.55rem 1rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "0.875rem",
                cursor: "pointer"
              }}
            >
              <Plus size={16} />
              <span>Create Document</span>
            </button>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem"
          }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderRadius: "14px",
                  border: "1px solid var(--border-color)",
                  padding: "1.1rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  position: "relative",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ padding: "0.4rem", borderRadius: "8px", backgroundColor: "#eff6ff", color: "#2563eb" }}>
                        <FileText size={18} />
                      </div>
                      <div>
                        <Link
                          to={`/documents/${doc.id}`}
                          style={{
                            fontSize: "1rem",
                            fontWeight: "700",
                            color: "var(--text-primary)",
                            textDecoration: "none",
                            display: "block",
                            maxWidth: "180px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {doc.title || "Untitled Document"}
                        </Link>
                      </div>
                    </div>

                    {doc.user_role === "owner" && (
                      <button
                        onClick={() => setDocToDelete(doc)}
                        style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "2px" }}
                        title="Delete Document"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    <Clock size={13} />
                    <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    {doc.is_public ? (
                      <span style={{ fontSize: "0.7rem", color: "#16a34a", display: "flex", alignItems: "center", gap: "2px" }}>
                        <Globe size={12} /> Public
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "2px" }}>
                        <Lock size={12} /> Private
                      </span>
                    )}

                    <span style={{
                      fontSize: "0.7rem",
                      padding: "0.15rem 0.45rem",
                      borderRadius: "6px",
                      backgroundColor: doc.user_role === "owner" ? "#dbeafe" : "#dcfce7",
                      color: doc.user_role === "owner" ? "#1e40af" : "#166534",
                      fontWeight: "700",
                      textTransform: "capitalize"
                    }}>
                      {doc.user_role}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Prompt Modal for Creating Doc */}
      <PromptModal
        isOpen={showCreateModal}
        title="Create New Document"
        placeholder="Enter document title (e.g. Q3 Roadmap)..."
        confirmText="Create Document"
        onConfirm={handleCreateDocument}
        onCancel={() => setShowCreateModal(false)}
      />

      {/* Confirm Modal for Deleting Doc */}
      <ConfirmModal
        isOpen={!!docToDelete}
        title="Delete Document?"
        message={`Are you sure you want to delete "${docToDelete?.title}"? This cannot be undone.`}
        confirmText="Delete"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDocToDelete(null)}
      />
    </div>
  );
}
