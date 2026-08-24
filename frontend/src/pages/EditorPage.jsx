import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { useCollaboration } from "../hooks/useCollaboration";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
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
  WifiOff,
  Sun,
  Moon
} from "lucide-react";

export default function EditorPage() {
  const { id } = useParams();
  const docId = parseInt(id, 10);
  const { user: currentUser } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

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
  const [activeTab, setActiveTab] = useState("text");
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

  const handleNotifyMention = (mentionTag) => {
    showToast(`🔔 ${mentionTag} was notified of your mention!`, "info");
  };

  const allCollaborators = docMeta?.collaborators || [];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-primary)" }}>
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div style={{
          backgroundColor: "#fef3c7", color: "#92400e", padding: "0.35rem 1rem",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          fontSize: "0.8125rem", fontWeight: "600", borderBottom: "1px solid #fde68a"
        }}>
          <WifiOff size={15} />
          <span>You are working offline. Changes are auto-saved locally.</span>
        </div>
      )}

      {/* Responsive Top Bar */}
      <header style={{
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-color)",
        padding: "0.5rem 1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 30,
        flexWrap: "wrap",
        gap: "0.5rem"
      }}>
        {/* Left: Back & Editable Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0, flex: "1 1 auto" }}>
          <Link
            to="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
              padding: "0.35rem",
              borderRadius: "8px",
              textDecoration: "none"
            }}
            title="Back to Documents"
          >
            <ArrowLeft size={18} />
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", minWidth: 0 }}>
            <FileEdit size={16} color="#2563eb" style={{ flexShrink: 0 }} />
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
                fontSize: "0.95rem",
                fontWeight: "700",
                color: "var(--text-primary)",
                border: "1px solid transparent",
                background: "transparent",
                outline: "none",
                maxWidth: "180px",
                padding: "2px 4px",
                borderRadius: "6px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
              onFocus={(e) => e.target.style.borderColor = "#93c5fd"}
            />
            {titleSaved && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.75rem", color: "#16a34a", fontWeight: "600", flexShrink: 0 }}>
                <CheckCircle size={12} /> Saved
              </span>
            )}
          </div>
        </div>

        {/* Center: Mode Switcher Tabs */}
        <div style={{
          display: "flex",
          backgroundColor: "var(--bg-primary)",
          padding: "0.2rem",
          borderRadius: "10px",
          border: "1px solid var(--border-color)"
        }}>
          <button
            onClick={() => setActiveTab("text")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.3rem 0.75rem",
              borderRadius: "7px",
              border: "none",
              backgroundColor: activeTab === "text" ? "var(--bg-surface)" : "transparent",
              color: activeTab === "text" ? "#2563eb" : "var(--text-secondary)",
              fontWeight: "600",
              fontSize: "0.8125rem",
              cursor: "pointer",
              boxShadow: activeTab === "text" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
            }}
          >
            <FileText size={15} />
            <span>Doc</span>
          </button>
          <button
            onClick={() => setActiveTab("canvas")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.3rem 0.75rem",
              borderRadius: "7px",
              border: "none",
              backgroundColor: activeTab === "canvas" ? "var(--bg-surface)" : "transparent",
              color: activeTab === "canvas" ? "#2563eb" : "var(--text-secondary)",
              fontWeight: "600",
              fontSize: "0.8125rem",
              cursor: "pointer",
              boxShadow: activeTab === "canvas" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
            }}
          >
            <Palette size={15} />
            <span>Canvas</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              padding: "0.4rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} />}
          </button>

          {/* Comments */}
          <button
            onClick={() => setShowComments(!showComments)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.4rem 0.65rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: showComments ? "#eff6ff" : "var(--bg-surface)",
              color: showComments ? "#2563eb" : "var(--text-secondary)",
              fontSize: "0.8125rem",
              cursor: "pointer",
              fontWeight: "500"
            }}
            title="Comments & Discussions"
          >
            <MessageSquare size={15} />
            <span className="hidden-mobile">Comments</span>
          </button>

          {/* Export */}
          <button
            onClick={() => setShowExport(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.4rem 0.65rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-surface)",
              fontSize: "0.8125rem",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontWeight: "500"
            }}
            title="Export & Import"
          >
            <Download size={15} />
            <span className="hidden-mobile">Export</span>
          </button>

          {/* History */}
          <button
            onClick={() => setShowHistory(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.4rem 0.65rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-surface)",
              fontSize: "0.8125rem",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontWeight: "500"
            }}
            title="Version History"
          >
            <History size={15} />
            <span className="hidden-mobile">History</span>
          </button>

          {/* Share */}
          {(docMeta?.user_role === "owner" || docMeta?.is_public) && (
            <button
              onClick={() => setShowShare(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.4rem 0.75rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: "0.8125rem",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)"
              }}
            >
              <Share2 size={15} />
              <span>Share</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
        {activeTab === "text" ? (
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem 1rem",
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
            showToast("Restored document checkpoint successfully!");
          }}
        />
      )}

      {/* Comments Drawer with @mention */}
      {showComments && (
        <CommentsDrawer
          docId={docId}
          currentUserId={currentUser?.id}
          allCollaborators={allCollaborators}
          initialDraft={commentDraft}
          onClearDraft={() => setCommentDraft(null)}
          onNotifyMention={handleNotifyMention}
          onClose={() => setShowComments(false)}
        />
      )}

      {/* Export Modal */}
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
