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
  const { toggleTheme, isDark } = useTheme();

  const [docMeta, setDocMeta] = useState(null);
  const [title, setTitle] = useState("");
  const [titleSaved, setTitleSaved] = useState(false);

  // Modals & Drawers
  const [showShare, setShowShare] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [commentDraft, setCommentDraft] = useState(null);
  const [incomingCommentEvent, setIncomingCommentEvent] = useState(null);

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

  const handleRemoteComment = (data) => {
    setIncomingCommentEvent(data);
    if (data.sender_id !== currentUser?.id) {
      const myName = currentUser?.full_name?.toLowerCase();
      const myEmail = currentUser?.email?.toLowerCase();
      const isMentioned = (data.mentioned_names || []).some((n) => myName && n.toLowerCase().includes(myName)) ||
                          (data.mentioned_emails || []).includes(myEmail);

      if (isMentioned) {
        showToast(`🔔 ${data.sender_name} mentioned you in a comment!`, "info");
      }
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
    sendCommentEvent,
  } = useCollaboration(docId, handleRemoteDraw, handleRemoteComment);

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

      {/* Modern High-End Top Header (Single-line 56px, Zero Wrapping) */}
      <header style={{
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-color)",
        padding: "0.45rem 1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 30,
        height: "56px",
        flexShrink: 0
      }}>
        {/* Left: Back & Editable Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0, flex: "0 1 auto" }}>
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
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", minWidth: 0 }}>
            <FileEdit size={16} color="var(--accent-color)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={title}
              disabled={isReadOnly}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={(e) => saveTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
              placeholder="Untitled Document"
              title="Click to rename document"
              style={{
                fontSize: "0.95rem",
                fontWeight: "700",
                color: "var(--text-primary)",
                border: "1px solid transparent",
                background: "transparent",
                outline: "none",
                width: "clamp(110px, 20vw, 220px)",
                padding: "2px 6px",
                borderRadius: "6px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--input-focus)"}
            />
            {titleSaved && (
              <span className="hidden-mobile" style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.75rem", color: "#16a34a", fontWeight: "600", flexShrink: 0 }}>
                <CheckCircle size={12} /> Saved
              </span>
            )}
          </div>
        </div>

        {/* Center: Sleek Segmented Doc / Canvas Tab Switcher */}
        <div style={{
          display: "flex",
          backgroundColor: "var(--bg-primary)",
          padding: "3px",
          borderRadius: "10px",
          border: "1px solid var(--border-color)",
          flexShrink: 0
        }}>
          <button
            onClick={() => setActiveTab("text")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.35rem 0.85rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: activeTab === "text" ? "var(--bg-surface)" : "transparent",
              color: activeTab === "text" ? "var(--accent-color)" : "var(--text-secondary)",
              fontWeight: "700",
              fontSize: "0.8125rem",
              cursor: "pointer",
              boxShadow: activeTab === "text" ? "var(--shadow-sm)" : "none",
              transition: "all 0.15s ease"
            }}
          >
            <FileText size={15} />
            <span>Document</span>
          </button>
          <button
            onClick={() => setActiveTab("canvas")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.35rem 0.85rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: activeTab === "canvas" ? "var(--bg-surface)" : "transparent",
              color: activeTab === "canvas" ? "var(--accent-color)" : "var(--text-secondary)",
              fontWeight: "700",
              fontSize: "0.8125rem",
              cursor: "pointer",
              boxShadow: activeTab === "canvas" ? "var(--shadow-sm)" : "none",
              transition: "all 0.15s ease"
            }}
          >
            <Palette size={15} />
            <span>Whiteboard</span>
          </button>
        </div>

        {/* Right: Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
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
              backgroundColor: showComments ? "var(--accent-glow)" : "var(--bg-surface)",
              color: showComments ? "var(--accent-color)" : "var(--text-secondary)",
              fontSize: "0.8125rem",
              cursor: "pointer",
              fontWeight: "600"
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
              fontWeight: "600"
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
              fontWeight: "600"
            }}
            title="Version History"
          >
            <History size={15} />
            <span className="hidden-mobile">History</span>
          </button>

          {/* Share Button */}
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
                backgroundColor: "var(--accent-color)",
                color: "#ffffff",
                fontSize: "0.8125rem",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(59, 130, 246, 0.25)"
              }}
            >
              <Share2 size={15} />
              <span className="hidden-mobile">Share</span>
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

      {/* Real-Time Comments Drawer with Live Broadcast */}
      {showComments && (
        <CommentsDrawer
          docId={docId}
          currentUserId={currentUser?.id}
          allCollaborators={allCollaborators}
          initialDraft={commentDraft}
          onClearDraft={() => setCommentDraft(null)}
          onSendCommentEvent={sendCommentEvent}
          incomingCommentEvent={incomingCommentEvent}
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
