import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { History, X, RotateCcw, Clock, Plus } from "lucide-react";

export default function RevisionHistoryDrawer({ docId, isOwner, onClose, onRollback }) {
  const [revisions, setRevisions] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRevisions = async () => {
    try {
      const data = await api.getRevisions(docId);
      setRevisions(data);
    } catch (err) {
      console.error("Failed to load revisions", err);
    }
  };

  useEffect(() => {
    fetchRevisions();
  }, [docId]);

  const handleCreateSnapshot = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading(true);
    try {
      await api.createSnapshot(docId, comment.trim());
      setComment("");
      await fetchRevisions();
    } catch (err) {
      alert("Error saving snapshot: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (snapId) => {
    if (confirm("Are you sure you want to restore this revision?")) {
      try {
        const restored = await api.rollbackSnapshot(docId, snapId);
        onRollback(restored);
        onClose();
      } catch (err) {
        alert("Error restoring version: " + err.message);
      }
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0,
      width: "360px", backgroundColor: "#ffffff",
      boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
      zIndex: 50, display: "flex", flexDirection: "column",
      borderLeft: "1px solid #e2e8f0"
    }}>
      <div style={{ padding: "1rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <History size={20} color="#2563eb" />
          <h3 style={{ fontSize: "1.125rem", fontWeight: "600" }}>Revision History</h3>
        </div>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ padding: "1rem", borderBottom: "1px solid #f1f5f9" }}>
        <form onSubmit={handleCreateSnapshot} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="Save version note..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ flex: 1, padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.875rem" }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: "0.4rem 0.75rem", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.875rem" }}
          >
            <Plus size={16} />
          </button>
        </form>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {revisions.map((rev) => (
          <div key={rev.id} style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
              <span style={{ fontWeight: "600", fontSize: "0.875rem", color: "#1e293b" }}>
                Version {rev.version}
              </span>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Clock size={12} />
                {new Date(rev.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#475569", marginBottom: "0.5rem" }}>
              {rev.comment || "Auto checkpoint"}
            </div>
            {isOwner && (
              <button
                onClick={() => handleRestore(rev.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.35rem",
                  padding: "0.3rem 0.6rem", borderRadius: "4px",
                  border: "1px solid #cbd5e1", backgroundColor: "#fff",
                  fontSize: "0.75rem", color: "#2563eb", cursor: "pointer", fontWeight: "500"
                }}
              >
                <RotateCcw size={12} />
                <span>Restore Version</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
