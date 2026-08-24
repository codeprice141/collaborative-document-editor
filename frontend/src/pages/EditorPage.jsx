import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { useCollaboration } from "../hooks/useCollaboration";
import ShareModal from "../components/ShareModal";
import RevisionHistoryDrawer from "../components/RevisionHistoryDrawer";
import { ArrowLeft, Share2, History, Wifi, WifiOff } from "lucide-react";

export default function EditorPage() {
  const { id } = useParams();
  const docId = parseInt(id, 10);
  const [docMeta, setDocMeta] = useState(null);
  const [title, setTitle] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const textareaRef = useRef(null);

  const {
    content,
    setContent,
    version,
    userRole,
    activeUsers,
    connectionStatus,
    sendOperation,
    sendCursor,
  } = useCollaboration(docId);

  const isReadOnly = userRole === "viewer";

  const fetchDoc = async () => {
    try {
      const data = await api.getDocument(docId);
      setDocMeta(data);
      setTitle(data.title);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDoc();
  }, [docId]);

  const handleTitleBlur = async () => {
    if (title !== docMeta?.title && !isReadOnly) {
      try {
        await api.updateDocument(docId, { title });
      } catch (err) {
        console.error("Failed to save title", err);
      }
    }
  };

  const handleTextChange = (e) => {
    if (isReadOnly) return;
    const newText = e.target.value;
    const oldText = content;
    const cursor = e.target.selectionStart;

    if (newText.length > oldText.length) {
      const diffLen = newText.length - oldText.length;
      const pos = cursor - diffLen;
      const insertedText = newText.slice(pos, cursor);
      sendOperation({
        op_type: "insert",
        position: pos,
        text: insertedText,
      });
    } else if (newText.length < oldText.length) {
      const diffLen = oldText.length - newText.length;
      const pos = cursor;
      sendOperation({
        op_type: "delete",
        position: pos,
        length: diffLen,
      });
    }

    setContent(newText);
    sendCursor(cursor, true);
  };

  const handleCursorMove = (e) => {
    const cursor = e.target.selectionStart;
    sendCursor(cursor, false);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
      {/* Editor Top Bar */}
      <header style={{
        backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0",
        padding: "0.5rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link to="/dashboard" style={{ display: "flex", alignItems: "center", color: "#64748b" }}>
            <ArrowLeft size={20} />
          </Link>

          <div>
            <input
              type="text"
              value={title}
              disabled={isReadOnly}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Untitled Document"
              style={{
                fontSize: "1.125rem", fontWeight: "700", color: "#0f172a",
                border: "none", background: "transparent", outline: "none", width: "300px"
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "#94a3b8" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                {connectionStatus === "connected" ? (
                  <Wifi size={12} color="#10b981" />
                ) : (
                  <WifiOff size={12} color="#ef4444" />
                )}
                {connectionStatus === "connected" ? "Live Synced" : "Connecting..."}
              </span>
              <span>•</span>
              <span>v{version}</span>
              <span>•</span>
              <span style={{ textTransform: "capitalize", fontWeight: "600", color: "#64748b" }}>{userRole} Mode</span>
            </div>
          </div>
        </div>

        {/* Right Collaborators & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Active Collaborators Bubbles */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {activeUsers.map((u) => (
              <div
                key={u.client_id}
                title={`${u.name} (${u.email})`}
                style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  backgroundColor: u.color || "#2563eb", color: "#ffffff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: "700", border: "2px solid #ffffff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)", marginLeft: "-6px"
                }}
              >
                {u.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowHistory(true)}
            style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              padding: "0.45rem 0.75rem", borderRadius: "6px",
              border: "1px solid #cbd5e1", backgroundColor: "#ffffff",
              fontSize: "0.875rem", cursor: "pointer", color: "#475569"
            }}
          >
            <History size={16} />
            <span>History</span>
          </button>

          {docMeta?.user_role === "owner" && (
            <button
              onClick={() => setShowShare(true)}
              style={{
                display: "flex", alignItems: "center", gap: "0.35rem",
                padding: "0.45rem 0.85rem", borderRadius: "6px",
                border: "none", backgroundColor: "#2563eb", color: "#ffffff",
                fontSize: "0.875rem", fontWeight: "500", cursor: "pointer"
              }}
            >
              <Share2 size={16} />
              <span>Share</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Document Workspace */}
      <main style={{ flex: 1, overflowY: "auto", padding: "2rem", display: "flex", justifyContent: "center" }}>
        <div style={{
          width: "100%", maxWidth: "850px", minHeight: "800px",
          backgroundColor: "#ffffff", borderRadius: "8px",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)",
          padding: "3rem", display: "flex", flexDirection: "column", position: "relative"
        }}>
          {isReadOnly && (
            <div style={{ backgroundColor: "#fef3c7", color: "#92400e", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.875rem", marginBottom: "1rem" }}>
              👁️ You are in Viewer mode. You cannot edit this document.
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={content}
            readOnly={isReadOnly}
            onChange={handleTextChange}
            onKeyUp={handleCursorMove}
            onClick={handleCursorMove}
            placeholder="Type your document notes, story, or ideas here..."
            style={{
              width: "100%", flex: 1, border: "none", outline: "none", resize: "none",
              fontSize: "1.05rem", lineHeight: "1.75", fontFamily: "inherit",
              color: "#1e293b", backgroundColor: "transparent"
            }}
          />
        </div>
      </main>

      {showShare && (
        <ShareModal
          docId={docId}
          collaborators={docMeta?.collaborators || []}
          onClose={() => setShowShare(false)}
          onShared={fetchDoc}
        />
      )}

      {showHistory && (
        <RevisionHistoryDrawer
          docId={docId}
          isOwner={docMeta?.user_role === "owner"}
          onClose={() => setShowHistory(false)}
          onRollback={(restored) => {
            setContent(restored.content);
            fetchDoc();
          }}
        />
      )}
    </div>
  );
}
