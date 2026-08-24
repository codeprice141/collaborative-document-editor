import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { useCollaboration } from "../hooks/useCollaboration";
import ShareModal from "../components/ShareModal";
import RevisionHistoryDrawer from "../components/RevisionHistoryDrawer";
import WhiteboardCanvas from "../components/WhiteboardCanvas";
import {
  ArrowLeft,
  Share2,
  History,
  Wifi,
  WifiOff,
  FileText,
  Palette,
  Users,
  Sparkles,
  CheckCircle2
} from "lucide-react";

export default function EditorPage() {
  const { id } = useParams();
  const docId = parseInt(id, 10);
  const [docMeta, setDocMeta] = useState(null);
  const [title, setTitle] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("text"); // "text" | "canvas"
  const textareaRef = useRef(null);
  const drawListenerRef = useRef(null);

  const registerDrawListener = (callback) => {
    drawListenerRef.current = callback;
  };

  const handleRemoteDraw = (stroke, peerColor, peerName) => {
    if (drawListenerRef.current) {
      drawListenerRef.current(stroke, peerColor, peerName);
    }
  };

  const {
    content,
    setContent,
    version,
    userRole,
    myColor,
    activeUsers,
    remoteCursors,
    typingUsers,
    connectionStatus,
    sendOperation,
    sendCursor,
    sendDraw,
  } = useCollaboration(docId, handleRemoteDraw);

  const isReadOnly = userRole === "viewer";

  // Load document metadata
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

  // Combine active connected users with all invited collaborators to show status
  const allCollaborators = docMeta?.collaborators || [];
  const activeUserEmails = new Set(activeUsers.map((u) => u.email));

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
      {/* Top Navigation Bar */}
      <header style={{
        backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0",
        padding: "0.5rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        {/* Left: Back & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link to="/dashboard" style={{ display: "flex", alignItems: "center", color: "#64748b", padding: "0.4rem", borderRadius: "6px" }} title="Back to Dashboard">
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
                border: "none", background: "transparent", outline: "none", width: "260px"
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

        {/* Center: Mode Switcher (Text vs Canvas) */}
        <div style={{ display: "flex", backgroundColor: "#f1f5f9", padding: "0.25rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <button
            onClick={() => setActiveTab("text")}
            style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              padding: "0.35rem 0.85rem", borderRadius: "6px", border: "none",
              backgroundColor: activeTab === "text" ? "#ffffff" : "transparent",
              color: activeTab === "text" ? "#2563eb" : "#64748b",
              fontWeight: "600", fontSize: "0.875rem", cursor: "pointer",
              boxShadow: activeTab === "text" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
            }}
          >
            <FileText size={16} />
            <span>Document</span>
          </button>
          <button
            onClick={() => setActiveTab("canvas")}
            style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              padding: "0.35rem 0.85rem", borderRadius: "6px", border: "none",
              backgroundColor: activeTab === "canvas" ? "#ffffff" : "transparent",
              color: activeTab === "canvas" ? "#2563eb" : "#64748b",
              fontWeight: "600", fontSize: "0.875rem", cursor: "pointer",
              boxShadow: activeTab === "canvas" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
            }}
          >
            <Palette size={16} />
            <span>Whiteboard</span>
          </button>
        </div>

        {/* Right: Collaborator Avatars & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Active & Offline Collaborators Stamps */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginRight: "0.5rem" }}>
            {activeUsers.map((u) => (
              <div
                key={u.client_id}
                title={`Active Now: ${u.name} (${u.email})`}
                style={{
                  position: "relative",
                  width: "32px", height: "32px", borderRadius: "50%",
                  backgroundColor: u.color || "#2563eb", color: "#ffffff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: "700", border: "2px solid #ffffff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
              >
                {u.name.charAt(0).toUpperCase()}
                {/* Glowing Green Online Stamp */}
                <span style={{
                  position: "absolute", bottom: "-2px", right: "-2px",
                  width: "10px", height: "10px", borderRadius: "50%",
                  backgroundColor: "#22c55e", border: "2px solid #ffffff"
                }} />
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

      {/* Main Content Workspace */}
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {activeTab === "text" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* Live Typing & Collaborators Info Banner */}
            {activeUsers.length > 1 && (
              <div style={{
                width: "100%", maxWidth: "850px", marginBottom: "0.75rem",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.4rem 0.75rem", backgroundColor: "#eff6ff",
                borderRadius: "8px", border: "1px solid #bfdbfe", fontSize: "0.8125rem", color: "#1e40af"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Users size={14} />
                  <span>
                    <strong>{activeUsers.length} active collaborators</strong> on this stone tablet right now!
                  </span>
                </div>
                {typingUsers.length > 0 && (
                  <span style={{ fontStyle: "italic", color: "#2563eb", animation: "pulse 1s infinite" }}>
                    ⚡ Typing in progress...
                  </span>
                )}
              </div>
            )}

            {/* Document Sheet */}
            <div style={{
              width: "100%", maxWidth: "850px", minHeight: "800px",
              backgroundColor: "#ffffff", borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)",
              padding: "3rem", display: "flex", flexDirection: "column", position: "relative",
              border: "1px solid #e2e8f0"
            }}>
              {isReadOnly && (
                <div style={{ backgroundColor: "#fef3c7", color: "#92400e", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.875rem", marginBottom: "1rem" }}>
                  👁️ You are in Viewer mode. You cannot edit this document.
                </div>
              )}

              {/* Active Remote Cursors Flags */}
              <div style={{ position: "relative", width: "100%", height: 0 }}>
                {Object.entries(remoteCursors).map(([cid, data]) => {
                  const user = activeUsers.find((u) => u.client_id === cid);
                  if (!user) return null;
                  return (
                    <div
                      key={cid}
                      style={{
                        position: "absolute",
                        top: "-24px",
                        left: `${Math.min(100, (data.cursor?.index || 0) * 1.5)}px`,
                        backgroundColor: user.color || "#2563eb",
                        color: "#fff",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        fontWeight: "600",
                        pointerEvents: "none",
                        transition: "left 0.1s ease",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                        zIndex: 10
                      }}
                    >
                      {user.name} ✏️
                    </div>
                  );
                })}
              </div>

              <textarea
                ref={textareaRef}
                value={content}
                readOnly={isReadOnly}
                onChange={handleTextChange}
                onKeyUp={handleCursorMove}
                onClick={handleCursorMove}
                placeholder="Type your notes, ideas, or write together in real time..."
                style={{
                  width: "100%", flex: 1, border: "none", outline: "none", resize: "none",
                  fontSize: "1.05rem", lineHeight: "1.75", fontFamily: "inherit",
                  color: "#1e293b", backgroundColor: "transparent"
                }}
              />
            </div>
          </div>
        ) : (
          <WhiteboardCanvas
            onSendDraw={sendDraw}
            registerDrawListener={registerDrawListener}
            isReadOnly={isReadOnly}
          />
        )}
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
