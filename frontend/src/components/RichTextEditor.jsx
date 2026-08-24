import React, { useRef, useState, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Highlighter,
  RemoveFormatting,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MessageSquarePlus
} from "lucide-react";

export default function RichTextEditor({
  htmlContent,
  onHtmlChange,
  isReadOnly,
  activeUsers = [],
  remoteCursors = {},
  onCursorChange,
  onOpenCommentDraft
}) {
  const editorRef = useRef(null);
  const isInternalUpdate = useRef(false);

  // Floating comment button state
  const [selectedText, setSelectedText] = useState("");
  const [selectionCoords, setSelectionCoords] = useState(null);

  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    h1: false,
    h2: false,
    h3: false,
    p: false,
    ul: false,
    ol: false,
    quote: false,
    code: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
  });

  const updateActiveStyles = () => {
    if (isReadOnly || !editorRef.current) return;
    try {
      const isBold = document.queryCommandState("bold");
      const isItalic = document.queryCommandState("italic");
      const isUnderline = document.queryCommandState("underline");
      const isStrike = document.queryCommandState("strikeThrough");
      const isUl = document.queryCommandState("insertUnorderedList");
      const isOl = document.queryCommandState("insertOrderedList");
      const isLeft = document.queryCommandState("justifyLeft");
      const isCenter = document.queryCommandState("justifyCenter");
      const isRight = document.queryCommandState("justifyRight");

      const selection = window.getSelection();
      let currentBlock = "";
      if (selection && selection.rangeCount > 0) {
        let node = selection.anchorNode;
        while (node && node !== editorRef.current) {
          const tag = node.nodeName?.toLowerCase();
          if (["h1", "h2", "h3", "blockquote", "pre", "p"].includes(tag)) {
            currentBlock = tag;
            break;
          }
          node = node.parentNode;
        }

        const text = selection.toString().trim();
        if (text.length > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSelectedText(text);
          setSelectionCoords({
            top: rect.top - 45,
            left: rect.left + rect.width / 2,
          });
        } else {
          setSelectedText("");
          setSelectionCoords(null);
        }
      } else {
        setSelectedText("");
        setSelectionCoords(null);
      }

      setActiveStyles({
        bold: isBold,
        italic: isItalic,
        underline: isUnderline,
        strikeThrough: isStrike,
        h1: currentBlock === "h1",
        h2: currentBlock === "h2",
        h3: currentBlock === "h3",
        p: currentBlock === "p" || (!currentBlock && !isUl && !isOl),
        ul: isUl,
        ol: isOl,
        quote: currentBlock === "blockquote",
        code: currentBlock === "pre",
        justifyLeft: isLeft,
        justifyCenter: isCenter,
        justifyRight: isRight,
      });
    } catch (e) {}
  };

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveStyles);
    return () => {
      document.removeEventListener("selectionchange", updateActiveStyles);
    };
  }, [isReadOnly]);

  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== htmlContent) {
        editorRef.current.innerHTML = htmlContent || "<p><br></p>";
      }
    }
    isInternalUpdate.current = false;
  }, [htmlContent]);

  const exec = (command, value = null) => {
    if (isReadOnly) return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
      updateActiveStyles();
    }
  };

  const handleInput = () => {
    if (isReadOnly || !editorRef.current) return;
    isInternalUpdate.current = true;
    const newHtml = editorRef.current.innerHTML;
    onHtmlChange(newHtml);
    sendCursorPosition();
    updateActiveStyles();
  };

  const sendCursorPosition = () => {
    if (isReadOnly || !onCursorChange) return;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      onCursorChange(range.startOffset);
    }
    updateActiveStyles();
  };

  const handleFloatingCommentClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOpenCommentDraft && selectedText) {
      onOpenCommentDraft(selectedText);
      setSelectedText("");
      setSelectionCoords(null);
    }
  };

  const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bae6fd", "#fbcfe8", "#fed7aa"];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      width: "100%",
      maxWidth: "880px",
      margin: "0 auto",
      alignItems: "center",
      paddingBottom: "30vh",
      position: "relative"
    }}>
      {/* Floating Mini Action for Selected Text */}
      {selectionCoords && selectedText && !isReadOnly && (
        <div style={{
          position: "fixed",
          top: `${Math.max(10, selectionCoords.top)}px`,
          left: `${selectionCoords.left}px`,
          transform: "translateX(-50%)",
          zIndex: 40,
          backgroundColor: "#0f172a",
          borderRadius: "8px",
          padding: "4px 8px",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          animation: "fadeIn 0.15s ease-out"
        }}>
          <button
            onClick={handleFloatingCommentClick}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              fontSize: "0.75rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 4px"
            }}
          >
            <MessageSquarePlus size={14} color="#60a5fa" />
            <span>Comment</span>
          </button>
        </div>
      )}

      {/* Modern High-End Padded Formatting Toolbar */}
      {!isReadOnly && (
        <div style={{
          position: "sticky",
          top: "12px",
          zIndex: 20,
          backgroundColor: "var(--bg-surface-glass)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--border-color)",
          borderRadius: "14px",
          padding: "0.45rem 0.65rem",
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.03)",
          marginBottom: "1.75rem",
          maxWidth: "100%",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch"
        }}>
          {/* Text Styles */}
          <div style={{ display: "flex", gap: "3px", borderRight: "1px solid var(--border-color)", paddingRight: "0.45rem", flexShrink: 0 }}>
            <button onClick={() => exec("bold")} style={toolBtn(activeStyles.bold)} title="Bold (Ctrl+B)">
              <Bold size={16} />
            </button>
            <button onClick={() => exec("italic")} style={toolBtn(activeStyles.italic)} title="Italic (Ctrl+I)">
              <Italic size={16} />
            </button>
            <button onClick={() => exec("underline")} style={toolBtn(activeStyles.underline)} title="Underline (Ctrl+U)">
              <Underline size={16} />
            </button>
            <button onClick={() => exec("strikeThrough")} style={toolBtn(activeStyles.strikeThrough)} title="Strikethrough">
              <Strikethrough size={16} />
            </button>
          </div>

          {/* Headings */}
          <div style={{ display: "flex", gap: "3px", borderRight: "1px solid var(--border-color)", paddingRight: "0.45rem", flexShrink: 0 }}>
            <button onClick={() => exec("formatBlock", "<h1>")} style={toolBtn(activeStyles.h1)} title="Heading 1">
              <Heading1 size={16} />
            </button>
            <button onClick={() => exec("formatBlock", "<h2>")} style={toolBtn(activeStyles.h2)} title="Heading 2">
              <Heading2 size={16} />
            </button>
            <button onClick={() => exec("formatBlock", "<h3>")} style={toolBtn(activeStyles.h3)} title="Heading 3">
              <Heading3 size={16} />
            </button>
            <button onClick={() => exec("formatBlock", "<p>")} style={toolBtn(activeStyles.p)} title="Paragraph">
              <span style={{ fontSize: "0.85rem", fontWeight: "700", padding: "0 2px" }}>P</span>
            </button>
          </div>

          {/* Lists & Quotes */}
          <div style={{ display: "flex", gap: "3px", borderRight: "1px solid var(--border-color)", paddingRight: "0.45rem", flexShrink: 0 }}>
            <button onClick={() => exec("insertUnorderedList")} style={toolBtn(activeStyles.ul)} title="Bullet List">
              <List size={16} />
            </button>
            <button onClick={() => exec("insertOrderedList")} style={toolBtn(activeStyles.ol)} title="Numbered List">
              <ListOrdered size={16} />
            </button>
            <button onClick={() => exec("formatBlock", "<blockquote>")} style={toolBtn(activeStyles.quote)} title="Quote Block">
              <Quote size={16} />
            </button>
            <button onClick={() => exec("formatBlock", "<pre>")} style={toolBtn(activeStyles.code)} title="Code Block">
              <Code size={16} />
            </button>
          </div>

          {/* Alignment */}
          <div style={{ display: "flex", gap: "3px", borderRight: "1px solid var(--border-color)", paddingRight: "0.45rem", flexShrink: 0 }}>
            <button onClick={() => exec("justifyLeft")} style={toolBtn(activeStyles.justifyLeft)} title="Align Left">
              <AlignLeft size={16} />
            </button>
            <button onClick={() => exec("justifyCenter")} style={toolBtn(activeStyles.justifyCenter)} title="Align Center">
              <AlignCenter size={16} />
            </button>
            <button onClick={() => exec("justifyRight")} style={toolBtn(activeStyles.justifyRight)} title="Align Right">
              <AlignRight size={16} />
            </button>
          </div>

          {/* Highlights */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", paddingLeft: "0.25rem", flexShrink: 0 }}>
            <Highlighter size={14} color="var(--text-secondary)" />
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => exec("hiliteColor", c)}
                style={{
                  width: "16px", height: "16px", borderRadius: "50%",
                  backgroundColor: c, border: "1px solid var(--border-color)",
                  cursor: "pointer", padding: 0
                }}
                title="Highlight Color"
              />
            ))}
            <button onClick={() => exec("removeFormat")} style={{ ...toolBtn(false), marginLeft: "2px" }} title="Clear Formatting">
              <RemoveFormatting size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Infinite Expanding Document Surface */}
      <div style={{
        width: "100%",
        minHeight: "850px",
        height: "auto",
        backgroundColor: "var(--bg-surface)",
        borderRadius: "16px",
        boxShadow: "0 10px 30px -5px rgba(0,0,0,0.06), 0 4px 6px -2px rgba(0,0,0,0.02)",
        padding: "clamp(2rem, 5vw, 4rem) clamp(1.5rem, 6vw, 4.5rem) 150px clamp(1.5rem, 6vw, 4.5rem)",
        position: "relative",
        border: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        overflowWrap: "break-word",
        wordBreak: "break-word"
      }}>
        {/* Remote Cursor Flags */}
        <div style={{ position: "relative", width: "100%", height: 0 }}>
          {Object.entries(remoteCursors).map(([cid, data]) => {
            const user = activeUsers.find((u) => u.client_id === cid);
            if (!user) return null;
            const leftPos = Math.min(550, ((data.cursor?.index || 0) % 35) * 15);

            return (
              <div
                key={cid}
                style={{
                  position: "absolute",
                  top: "-26px",
                  left: `${leftPos}px`,
                  backgroundColor: user.color || "#2563eb",
                  color: "#ffffff",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  fontSize: "0.725rem",
                  fontWeight: "700",
                  pointerEvents: "none",
                  transition: "left 0.15s ease",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.2rem"
                }}
              >
                <span>{user.name}</span>
                <span>✏️</span>
              </div>
            );
          })}
        </div>

        {/* Contenteditable Rich Surface - Always expands inside the white sheet */}
        <div
          ref={editorRef}
          contentEditable={!isReadOnly}
          onInput={handleInput}
          onKeyUp={sendCursorPosition}
          onMouseUp={sendCursorPosition}
          onClick={sendCursorPosition}
          className="rich-document-body"
        />
      </div>
    </div>
  );
}

const toolBtn = (isActive) => ({
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  border: isActive ? "1px solid #93c5fd" : "1px solid transparent",
  backgroundColor: isActive ? "#eff6ff" : "transparent",
  color: isActive ? "#2563eb" : "var(--text-secondary)",
  fontWeight: isActive ? "700" : "500",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s ease"
});
