import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { useCollaboration } from "../hooks/useCollaboration";
import { useAuth } from "../context/AuthContext";
import RichTextEditor from "../components/RichTextEditor";
import WhiteboardCanvas from "../components/WhiteboardCanvas";
import CollaboratorDock from "../components/CollaboratorDock";
import ShareModal from "../components/ShareModal";
import RevisionHistoryDrawer from "../components/RevisionHistoryDrawer";
import CommentsDrawer from "../components/CommentsDrawer";
import ExportModal from "../components/ExportModal";
import Toast from "../components/Toast";
import {
  ArrowLeft,
  Share2,
  History,
  FileText,
  Palette,
  CheckCircle,
  FileEdit,
  MessageSquare,
  Download,
  WifiOff
} from "lucide-react";

export default function EditorPage() {
  const { id } = useParams();
  const docId = parseInt(id, 10);
  const { user: currentUser } = useAuth();

  const [docMeta, setDocMeta] = useState(null);
  const [title, setTitle] = useState("");
  const [titleSaved, setTitleSaved] = useState(false);

  // Modals & Drawers
  const [showShare, setShowShare] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [commentDraft, setCommentDraft] = useState(null);

  // Toast Notification
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  // Tab & Network
  const [activeTab, setActiveTab] = useState("text"); // "text" | "canvas"
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const drawListenerRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const showToast = (msg, type = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
  };

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
    // Cache in local storage for offline resilience
    localStorage.setItem(`offline_doc_${docId}`, newHtml);
  };

  const handleSaveDrawing = async (elementsJson) => {
    setDrawingData(elementsJson);
    localStorage.setItem(`offline_draw_${docId}`, elementsJson);
    if (!isReadOnly) {
      try {
        await api.updateDocument(docId, { drawing_data: elementsJson });
      } catch (e) {
        console.error("Failed to persist drawing data", e);
      }
    }
  };

  const handleOpenCommentDraft = (selectedText) => {
    setCommentDraft({ selectedText });
    setShowComments(true);
  };

  const handleImportContent = (importedHtml) => {
    handleHtmlChange(importedHtml);
    showToast("File imported successfully!");
  };

  const allCollaborators = docMeta?.collaborators || [];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div style={{
          backgroundColor: "#fef3c7", color: "#92400e", padding: "0.4rem 1rem",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          fontSize: "0.8125rem", fontWeight: "600", borderBottom: "1px solid #fde68a"
        }}>
          <WifiOff size={15} />
          <span>You are working offline. Changes are saved locally and will auto-sync when connection is restored.</span>
        </div>
      )}

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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Comments Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.45rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: showComments ? "#eff6ff" : "#ffffff",
              color: showComments ? "#2563eb" : "#475569",
              fontSize: "0.875rem",
              cursor: "pointer",
              fontWeight: "500"
            }}
            title="Comments & Discussions"
          >
            <MessageSquare size={16} />
            <span>Comments</span>
          </button>

          {/* Export / Import Button */}
          <button
            onClick={() => setShowExport(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.45rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              fontSize: "0.875rem",
              cursor: "pointer",
              color: "#475569",
              fontWeight: "500"
            }}
            title="Export & Import"
          >
            <Download size={16} />
            <span>Export</span>
          </button>

          {/* History Button */}
          <button
            onClick={() => setShowHistory(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.45rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              fontSize: "0.875rem",
              cursor: "pointer",
              color: "#475569",
              fontWeight: "500"
            }}
            title="Version History"
          >
            <History size={16} />
            <span>History</span>
          </button>

          {/* Share Button */}
          {(docMeta?.user_role === "owner" || docMeta?.is_public) && (
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
              onOpenCommentDraft={handleOpenCommentDraft}
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

      {/* Share Modal */}
      {showShare && (
        <ShareModal
          docId={docId}
          isPublic={docMeta?.is_public}
          publicRole={docMeta?.public_role}
          collaborators={allCollaborators}
          onClose={() => setShowShare(false)}
          onShared={fetchDoc}
        />
      )}

      {/* Revision History Drawer */}
      {showHistory && (
        <RevisionHistoryDrawer
          docId={docId}
          isOwner={docMeta?.user_role === "owner"}
          onClose={() => setShowHistory(false)}
          onRollback={(restored) => {
            setContent(restored.content);
            fetchDoc();
            showToast("Restored document revision successfully!");
          }}
        />
      )}

      {/* Inline Comments & Threaded Discussions Drawer */}
      {showComments && (
        <CommentsDrawer
          docId={docId}
          currentUserId={currentUser?.id}
          initialDraft={commentDraft}
          onClearDraft={() => setCommentDraft(null)}
          onClose={() => setShowComments(false)}
        />
      )}

      {/* Multi-Format Export & Import Modal */}
      {showExport && (
        <ExportModal
          isOpen={showExport}
          title={title}
          htmlContent={content}
          onImportContent={handleImportContent}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Toast Notification */}
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg("")} />
    </div>
  );
}
