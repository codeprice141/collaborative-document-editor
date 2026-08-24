import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import {
  MessageSquare,
  X,
  Send,
  CheckCircle2,
  Circle,
  CornerDownRight,
  Trash2,
  Quote,
  AtSign
} from "lucide-react";

export default function CommentsDrawer({
  docId,
  currentUserId,
  allCollaborators = [],
  onClose,
  initialDraft = null,
  onClearDraft,
  onNotifyMention
}) {
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyTexts, setReplyTexts] = useState({});
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // @mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState(null); // string | null
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [activeInputType, setActiveInputType] = useState("comment"); // "comment" | replyCommentId
  const textareaRef = useRef(null);

  const fetchComments = async () => {
    try {
      const data = await api.getComments(docId);
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [docId]);

  // Handle @mention search
  useEffect(() => {
    if (mentionQuery !== null) {
      const query = mentionQuery.toLowerCase();
      // Search in doc collaborators + team search
      const localMatches = allCollaborators
        .map((c) => c.user)
        .filter((u) => u && (u.full_name?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query)));

      if (localMatches.length > 0) {
        setMentionSuggestions(localMatches);
      } else if (query.length >= 1) {
        api.searchUsers(query).then((res) => {
          setMentionSuggestions(res || []);
        }).catch(() => {});
      } else {
        setMentionSuggestions(allCollaborators.map((c) => c.user));
      }
    } else {
      setMentionSuggestions([]);
    }
  }, [mentionQuery, allCollaborators]);

  const handleTextChange = (e, target = "comment") => {
    const text = e.target.value;
    if (target === "comment") {
      setNewCommentText(text);
    } else {
      setReplyTexts((prev) => ({ ...prev, [target]: text }));
    }

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1 && !/\s/.test(textBeforeCursor.slice(lastAtIndex + 1))) {
      const q = textBeforeCursor.slice(lastAtIndex + 1);
      setMentionQuery(q);
      setActiveInputType(target);
    } else {
      setMentionQuery(null);
    }
  };

  const selectMentionUser = (user) => {
    const mentionTag = `@${user.full_name} `;
    if (activeInputType === "comment") {
      const text = newCommentText;
      const cursorPos = textareaRef.current?.selectionStart || text.length;
      const textBefore = text.slice(0, cursorPos);
      const textAfter = text.slice(cursorPos);
      const lastAtIndex = textBefore.lastIndexOf("@");
      const newText = textBefore.slice(0, lastAtIndex) + mentionTag + textAfter;
      setNewCommentText(newText);
    } else {
      const commentId = activeInputType;
      const text = replyTexts[commentId] || "";
      const lastAtIndex = text.lastIndexOf("@");
      const newText = text.slice(0, lastAtIndex) + mentionTag;
      setReplyTexts((prev) => ({ ...prev, [commentId]: newText }));
    }
    setMentionQuery(null);
  };

  const checkForMentionsAndNotify = (text) => {
    const matches = text.match(/@([a-zA-Z0-9_\s]+)/g);
    if (matches && matches.length > 0 && onNotifyMention) {
      matches.forEach((m) => {
        onNotifyMention(m.trim());
      });
    }
  };

  const handleCreateComment = async (e) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim()) return;
    setLoading(true);

    try {
      await api.createComment(docId, {
        content: newCommentText.trim(),
        selected_text: initialDraft?.selectedText || null,
        anchor_range: initialDraft?.anchorRange || null,
      });
      checkForMentionsAndNotify(newCommentText.trim());
      setNewCommentText("");
      if (onClearDraft) onClearDraft();
      await fetchComments();
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleResolve = async (commentId, currentResolved) => {
    try {
      await api.resolveComment(docId, commentId, !currentResolved);
      await fetchComments();
    } catch (err) {
      console.error("Failed to resolve comment", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.deleteComment(docId, commentId);
      await fetchComments();
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  };

  const handleSendReply = async (commentId) => {
    const text = replyTexts[commentId];
    if (!text || !text.trim()) return;

    try {
      await api.replyComment(docId, commentId, text.trim());
      checkForMentionsAndNotify(text.trim());
      setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
      await fetchComments();
    } catch (err) {
      console.error("Failed to post reply", err);
    }
  };

  const displayedComments = filter === "open"
    ? comments.filter((c) => !c.is_resolved)
    : comments;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      maxWidth: "380px",
      backgroundColor: "var(--bg-surface)",
      boxShadow: "-4px 0 25px rgba(0,0,0,0.15)",
      zIndex: 50,
      display: "flex",
      flexDirection: "column",
      borderLeft: "1px solid var(--border-color)"
    }}>
      {/* Drawer Header */}
      <div style={{
        padding: "1.1rem 1.25rem",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MessageSquare size={19} color="#2563eb" />
          <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)" }}>Comments & Discussions</h3>
        </div>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
          <X size={18} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", padding: "0.5rem 1.25rem", borderBottom: "1px solid var(--border-color)", gap: "0.5rem" }}>
        <button
          onClick={() => setFilter("all")}
          style={{
            padding: "0.25rem 0.65rem",
            borderRadius: "6px",
            border: "none",
            fontSize: "0.8125rem",
            fontWeight: "600",
            cursor: "pointer",
            backgroundColor: filter === "all" ? "#eff6ff" : "transparent",
            color: filter === "all" ? "#2563eb" : "var(--text-secondary)"
          }}
        >
          All ({comments.length})
        </button>
        <button
          onClick={() => setFilter("open")}
          style={{
            padding: "0.25rem 0.65rem",
            borderRadius: "6px",
            border: "none",
            fontSize: "0.8125rem",
            fontWeight: "600",
            cursor: "pointer",
            backgroundColor: filter === "open" ? "#eff6ff" : "transparent",
            color: filter === "open" ? "#2563eb" : "var(--text-secondary)"
          }}
        >
          Open ({comments.filter((c) => !c.is_resolved).length})
        </button>
      </div>

      {/* New Comment Input Box */}
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-primary)", position: "relative" }}>
        {initialDraft?.selectedText && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.35rem 0.6rem",
            borderRadius: "6px",
            backgroundColor: "#fef9c3",
            border: "1px solid #fef08a",
            fontSize: "0.75rem",
            color: "#854d0e",
            marginBottom: "0.6rem"
          }}>
            <Quote size={12} />
            <span style={{ fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              "{initialDraft.selectedText}"
            </span>
          </div>
        )}

        <form onSubmit={handleCreateComment} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <textarea
            ref={textareaRef}
            placeholder="Type comment or @mention a teammate..."
            value={newCommentText}
            onChange={(e) => handleTextChange(e, "comment")}
            rows={2}
            style={{
              width: "100%",
              padding: "0.5rem 0.65rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              fontSize: "0.875rem",
              outline: "none",
              resize: "none",
              fontFamily: "inherit"
            }}
          />

          {/* @mention Autocomplete Popover */}
          {mentionSuggestions.length > 0 && (
            <div style={{
              position: "absolute",
              bottom: "100%",
              left: "1.25rem",
              right: "1.25rem",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "10px",
              boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
              maxHeight: "160px",
              overflowY: "auto",
              zIndex: 60,
              padding: "4px"
            }}>
              <div style={{ padding: "4px 8px", fontSize: "0.7rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                Mention Teammate
              </div>
              {mentionSuggestions.map((u) => (
                <div
                  key={u.id}
                  onClick={() => selectMentionUser(u)}
                  style={{
                    padding: "0.45rem 0.6rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#eff6ff"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <div style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: "700" }}>
                    {u.full_name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: "600", color: "var(--text-primary)" }}>{u.full_name}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{u.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              <AtSign size={12} />
              <span>Type @ to mention</span>
            </div>

            <button
              type="submit"
              disabled={loading || !newCommentText.trim()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.85rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: newCommentText.trim() ? "#2563eb" : "#94a3b8",
                color: "#ffffff",
                fontSize: "0.8125rem",
                fontWeight: "600",
                cursor: newCommentText.trim() ? "pointer" : "default"
              }}
            >
              <Send size={13} />
              <span>Comment</span>
            </button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {displayedComments.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "3rem 1rem", fontSize: "0.875rem" }}>
            No comments yet. Select text to start a thread!
          </div>
        ) : (
          displayedComments.map((comment) => (
            <div
              key={comment.id}
              style={{
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
                backgroundColor: comment.is_resolved ? "var(--bg-primary)" : "var(--bg-surface)",
                padding: "0.85rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
              }}
            >
              {/* Comment Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                  <div style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: "#3b82f6",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: "700"
                  }}>
                    {comment.user?.full_name?.charAt(0) || "U"}
                  </div>
                  <span style={{ fontSize: "0.8125rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    {comment.user?.full_name || "Team Member"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <button
                    onClick={() => handleToggleResolve(comment.id, comment.is_resolved)}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: comment.is_resolved ? "#16a34a" : "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.2rem",
                      fontSize: "0.75rem",
                      fontWeight: "600"
                    }}
                    title={comment.is_resolved ? "Reopen comment" : "Resolve comment"}
                  >
                    {comment.is_resolved ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </button>

                  {comment.user_id === currentUserId && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "2px" }}
                      title="Delete comment"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Selected Text Reference */}
              {comment.selected_text && (
                <div style={{
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  backgroundColor: "#fef9c3",
                  fontSize: "0.75rem",
                  color: "#854d0e",
                  fontStyle: "italic",
                  marginBottom: "0.4rem",
                  borderLeft: "2px solid #eab308"
                }}>
                  "{comment.selected_text}"
                </div>
              )}

              {/* Comment Body */}
              <div style={{ fontSize: "0.875rem", color: comment.is_resolved ? "var(--text-secondary)" : "var(--text-primary)", lineHeight: "1.5", marginBottom: "0.6rem" }}>
                {comment.content}
              </div>

              {/* Threaded Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginLeft: "0.75rem", borderLeft: "2px solid var(--border-color)", paddingLeft: "0.6rem", marginBottom: "0.5rem" }}>
                  {comment.replies.map((reply) => (
                    <div key={reply.id} style={{ fontSize: "0.8125rem" }}>
                      <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>
                        {reply.user?.full_name || "Member"}:
                      </span>{" "}
                      <span style={{ color: "var(--text-secondary)" }}>{reply.content}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.4rem" }}>
                <input
                  type="text"
                  placeholder="Reply or @mention..."
                  value={replyTexts[comment.id] || ""}
                  onChange={(e) => handleTextChange(e, comment.id)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendReply(comment.id)}
                  style={{
                    flex: 1,
                    padding: "0.3rem 0.5rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    fontSize: "0.75rem",
                    outline: "none"
                  }}
                />
                <button
                  onClick={() => handleSendReply(comment.id)}
                  style={{
                    padding: "0.3rem 0.5rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#eff6ff",
                    color: "#2563eb",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: "600"
                  }}
                >
                  <CornerDownRight size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
