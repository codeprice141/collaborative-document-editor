import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import ConfirmModal from "./ConfirmModal";
import { History, X, RotateCcw, Clock, Plus } from "lucide-react";

export default function RevisionHistoryDrawer({ docId, isOwner, onClose, onRollback }) {
  const [revisions, setRevisions] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Restore confirm modal state
  const [snapToRestore, setSnapToRestore] = useState(null);
  const [restoring, setRestoring] = useState(false);

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
      console.error("Error saving snapshot", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!snapToRestore) return;
    setRestoring(true);
    try {
      const restored = await api.rollbackSnapshot(docId, snapToRestore.id);
      setSnapToRestore(null);
      onRollback(restored);
      onClose();
    } catch (err) {
      console.error("Error restoring version", err);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0,
      width: "360px", backgroundColor: "#ffffff",
      boxShadow: "-4px 0 25px rgba(0,0,0,0.1)",
      zIndex: 50, display: "flex", flexDirection: "column",
      borderLeft: "1px solid #e2e8f0"
    }}>
      <div style={{ padding: "1.1rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <History size={18} color="#2563eb" />
          <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>Version History</h3>
        </div>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9" }}>
        <form onSubmit={handleCreateSnapshot} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="Save version note..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{
              flex: 1, padding: "0.45rem 0.65rem", borderRadius: "8px",
              border: "1px solid #cbd5e1", fontSize: "0.875rem", outline: "none"
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.45rem 0.75rem", backgroundColor: "#2563eb", color: "#fff",
              border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.875rem",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            <Plus size={16} />
          </button>
        </form>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {revisions.map((rev) => (
          <div key={rev.id} style={{ padding: "0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
              <span style={{ fontWeight: "700", fontSize: "0.875rem", color: "#0f172a" }}>
                Version {rev.version}
              </span>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Clock size={12} />
                {new Date(rev.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#64748b", marginBottom: "0.6rem" }}>
              {rev.comment || "Auto checkpoint"}
            </div>
            {isOwner && (
              <button
                onClick={() => setSnapToRestore(rev)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.35rem",
                  padding: "0.35rem 0.65rem", borderRadius: "6px",
                  border: "1px solid #cbd5e1", backgroundColor: "#ffffff",
                  fontSize: "0.75rem", color: "#2563eb", cursor: "pointer", fontWeight: "600"
                }}
              >
                <RotateCcw size={12} />
                <span>Restore Version</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Custom Modern Restore Modal */}
      <ConfirmModal
        isOpen={!!snapToRestore}
        title={`Restore Version ${snapToRestore?.version}?`}
        message="This will restore the document text and whiteboard drawings to this checkpoint."
        confirmText="Restore Checkpoint"
        type="primary"
        loading={restoring}
        onConfirm={handleConfirmRestore}
        onCancel={() => setSnapToRestore(null)}
      />
    </div>
  );
}
