import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { useCollaboration } from "../hooks/useCollaboration";
import RichTextEditor from "../components/RichTextEditor";
import WhiteboardCanvas from "../components/WhiteboardCanvas";
import CollaboratorDock from "../components/CollaboratorDock";
import ShareModal from "../components/ShareModal";
import RevisionHistoryDrawer from "../components/RevisionHistoryDrawer";
import {
  ArrowLeft,
  Share2,
  History,
  FileText,
  Palette,
  CheckCircle,
  FileEdit
} from "lucide-react";

export default function EditorPage() {
  const { id } = useParams();
  const docId = parseInt(id, 10);
  const [docMeta, setDocMeta] = useState(null);
  const [title, setTitle] = useState("");
  const [titleSaved, setTitleSaved] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("text"); // "text" | "canvas"
  const drawListenerRef = useRef(null);

  const registerDrawListener = (callback) => {
    drawListenerRef.current = callback;
  };

  const handleRemoteDraw = (payload) => {
    if (drawListenerRef.current) {
      drawListenerRef.current(payload);
    }
  };

  const {
    content,
    setContent,
    drawingData,
    setDrawingData,
    version,
    userRole,
    activeUsers,
    remoteCursors,
    typingUsers,
    connectionStatus,
    sendOperation,
    sendCursor,
    sendDraw,
  } = useCollaboration(docId, handleRemoteDraw);

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

  const saveTitle = async (newTitle) => {
    if (newTitle.trim() && newTitle !== docMeta?.title && !isReadOnly) {
      try {
        await api.updateDocument(docId, { title: newTitle.trim() });
        setTitleSaved(true);
        setTimeout(() => setTitleSaved(false), 2000);
      } catch (err) {
        console.error("Failed to save title", err);
      }
    }
  };

  const handleHtmlChange = (newHtml) => {
    if (isReadOnly) return;
    setContent(newHtml);
    sendOperation({
      op_type: "replace",
      text: newHtml,
    });
  };

  const handleSaveDrawing = async (elementsJson) => {
    setDrawingData(elementsJson);
    if (!isReadOnly) {
      try {
        await api.updateDocument(docId, { drawing_data: elementsJson });
      } catch (e) {
        console.error("Failed to persist drawing data", e);
      }
    }
  };

  const allCollaborators = docMeta?.collaborators || [];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
      {/* Clean Minimalist Navigation Top Bar */}
      <header style={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "0.6rem 1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 30
      }}>
        {/* Left: Back & Clean Editable Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link
            to="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              padding: "0.4rem",
              borderRadius: "8px",
              textDecoration: "none"
            }}
            title="Back to Documents"
          >
            <ArrowLeft size={19} />
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <FileEdit size={17} color="#2563eb" />
            <input
              type="text"
              value={title}
              disabled={isReadOnly}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={(e) => saveTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
              placeholder="Untitled Document"
              title="Click to rename"
              style={{
                fontSize: "1.05rem",
                fontWeight: "700",
                color: "#0f172a",
                border: "1px solid transparent",
                background: "transparent",
                outline: "none",
                width: "240px",
                padding: "3px 6px",
                borderRadius: "6px",
                transition: "border 0.15s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#93c5fd"}
            />
            {titleSaved && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.75rem", color: "#16a34a", fontWeight: "600" }}>
                <CheckCircle size={13} /> Saved
              </span>
            )}
          </div>
        </div>

        {/* Center: Mode Switcher Tabs */}
        <div style={{
          display: "flex",
          backgroundColor: "#f1f5f9",
          padding: "0.25rem",
          borderRadius: "10px",
          border: "1px solid #e2e8f0"
        }}>
          <button
            onClick={() => setActiveTab("text")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.35rem 0.9rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: activeTab === "text" ? "#ffffff" : "transparent",
              color: activeTab === "text" ? "#2563eb" : "#64748b",
              fontWeight: "600",
              fontSize: "0.875rem",
              cursor: "pointer",
              boxShadow: activeTab === "text" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
            }}
          >
            <FileText size={16} />
            <span>Document</span>
          </button>
          <button
            onClick={() => setActiveTab("canvas")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.35rem 0.9rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: activeTab === "canvas" ? "#ffffff" : "transparent",
              color: activeTab === "canvas" ? "#2563eb" : "#64748b",
              fontWeight: "600",
              fontSize: "0.875rem",
              cursor: "pointer",
              boxShadow: activeTab === "canvas" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
            }}
          >
            <Palette size={16} />
            <span>Whiteboard</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <button
            onClick={() => setShowHistory(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.45rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              fontSize: "0.875rem",
              cursor: "pointer",
              color: "#475569",
              fontWeight: "500"
            }}
          >
            <History size={16} />
            <span>History</span>
          </button>

          {docMeta?.user_role === "owner" && (
            <button
              onClick={() => setShowShare(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.45rem 0.95rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)"
              }}
            >
              <Share2 size={16} />
              <span>Share</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace with Infinite Scroll Area */}
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
        {activeTab === "text" ? (
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "2rem 1.5rem",
            display: "flex",
            justifyContent: "center"
          }}>
            <RichTextEditor
              htmlContent={content}
              onHtmlChange={handleHtmlChange}
              isReadOnly={isReadOnly}
              activeUsers={activeUsers}
              remoteCursors={remoteCursors}
              onCursorChange={(idx) => sendCursor(idx, true)}
            />
          </div>
        ) : (
          <WhiteboardCanvas
            initialData={drawingData}
            onSaveData={handleSaveDrawing}
            onSendDraw={sendDraw}
            registerDrawListener={registerDrawListener}
            isReadOnly={isReadOnly}
          />
        )}

        {/* Bottom-Right Floating Collaborator Presence Dock */}
        <CollaboratorDock
          activeUsers={activeUsers}
          allCollaborators={allCollaborators}
          typingUsers={typingUsers}
          onOpenShare={() => setShowShare(true)}
        />
      </main>

      {showShare && (
        <ShareModal
          docId={docId}
          collaborators={allCollaborators}
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
