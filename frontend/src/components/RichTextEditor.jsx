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
  AlignRight
} from "lucide-react";

export default function RichTextEditor({
  htmlContent,
  onHtmlChange,
  isReadOnly,
  activeUsers = [],
  remoteCursors = {},
  onCursorChange
}) {
  const editorRef = useRef(null);
  const isInternalUpdate = useRef(false);

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

      // Check current block tag
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

  // Sync incoming HTML without resetting cursor during local typing
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

  const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bae6fd", "#fbcfe8", "#fed7aa"];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      width: "100%",
      maxWidth: "880px",
      alignItems: "center",
      paddingBottom: "30vh"
    }}>
      {/* Sticky Rich Formatting Toolbar with Active Highlights */}
      {!isReadOnly && (
        <div style={{
          position: "sticky",
          top: "12px",
          zIndex: 20,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "0.35rem 0.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.03)",
          marginBottom: "1.5rem",
          flexWrap: "wrap"
        }}>
          {/* Text Styles */}
          <div style={{ display: "flex", gap: "2px", borderRight: "1px solid #e2e8f0", paddingRight: "0.35rem" }}>
            <button
              onClick={() => exec("bold")}
              style={toolBtn(activeStyles.bold)}
              title="Bold (Ctrl+B)"
            >
              <Bold size={15} />
            </button>
            <button
              onClick={() => exec("italic")}
              style={toolBtn(activeStyles.italic)}
              title="Italic (Ctrl+I)"
            >
              <Italic size={15} />
            </button>
            <button
              onClick={() => exec("underline")}
              style={toolBtn(activeStyles.underline)}
              title="Underline (Ctrl+U)"
            >
              <Underline size={15} />
            </button>
            <button
              onClick={() => exec("strikeThrough")}
              style={toolBtn(activeStyles.strikeThrough)}
              title="Strikethrough"
            >
              <Strikethrough size={15} />
            </button>
          </div>

          {/* Headings */}
          <div style={{ display: "flex", gap: "2px", borderRight: "1px solid #e2e8f0", paddingRight: "0.35rem" }}>
            <button
              onClick={() => exec("formatBlock", "<h1>")}
              style={toolBtn(activeStyles.h1)}
              title="Heading 1"
            >
              <Heading1 size={15} />
            </button>
            <button
              onClick={() => exec("formatBlock", "<h2>")}
              style={toolBtn(activeStyles.h2)}
              title="Heading 2"
            >
              <Heading2 size={15} />
            </button>
            <button
              onClick={() => exec("formatBlock", "<h3>")}
              style={toolBtn(activeStyles.h3)}
              title="Heading 3"
            >
              <Heading3 size={15} />
            </button>
            <button
              onClick={() => exec("formatBlock", "<p>")}
              style={toolBtn(activeStyles.p)}
              title="Paragraph"
            >
              <span style={{ fontSize: "0.85rem", fontWeight: "700", padding: "0 2px" }}>P</span>
            </button>
          </div>

          {/* Lists & Quotes */}
          <div style={{ display: "flex", gap: "2px", borderRight: "1px solid #e2e8f0", paddingRight: "0.35rem" }}>
            <button
              onClick={() => exec("insertUnorderedList")}
              style={toolBtn(activeStyles.ul)}
              title="Bullet List"
            >
              <List size={15} />
            </button>
            <button
              onClick={() => exec("insertOrderedList")}
              style={toolBtn(activeStyles.ol)}
              title="Numbered List"
            >
              <ListOrdered size={15} />
            </button>
            <button
              onClick={() => exec("formatBlock", "<blockquote>")}
              style={toolBtn(activeStyles.quote)}
              title="Quote Block"
            >
              <Quote size={15} />
            </button>
            <button
              onClick={() => exec("formatBlock", "<pre>")}
              style={toolBtn(activeStyles.code)}
              title="Code Block"
            >
              <Code size={15} />
            </button>
          </div>

          {/* Alignment */}
          <div style={{ display: "flex", gap: "2px", borderRight: "1px solid #e2e8f0", paddingRight: "0.35rem" }}>
            <button
              onClick={() => exec("justifyLeft")}
              style={toolBtn(activeStyles.justifyLeft)}
              title="Align Left"
            >
              <AlignLeft size={15} />
            </button>
            <button
              onClick={() => exec("justifyCenter")}
              style={toolBtn(activeStyles.justifyCenter)}
              title="Align Center"
            >
              <AlignCenter size={15} />
            </button>
            <button
              onClick={() => exec("justifyRight")}
              style={toolBtn(activeStyles.justifyRight)}
              title="Align Right"
            >
              <AlignRight size={15} />
            </button>
          </div>

          {/* Highlights */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", paddingLeft: "0.2rem" }}>
            <Highlighter size={13} color="#64748b" />
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => exec("hiliteColor", c)}
                style={{
                  width: "15px", height: "15px", borderRadius: "50%",
                  backgroundColor: c, border: "1px solid #cbd5e1",
                  cursor: "pointer", padding: 0
                }}
                title="Highlight Color"
              />
            ))}
            <button
              onClick={() => exec("removeFormat")}
              style={{ ...toolBtn(false), marginLeft: "4px" }}
              title="Clear Formatting"
            >
              <RemoveFormatting size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Infinite Expanding Document Surface */}
      <div style={{
        width: "100%",
        minHeight: "calc(100vh - 200px)",
        height: "auto",
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.02)",
        padding: "3.5rem 4.5rem",
        position: "relative",
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        overflowWrap: "break-word",
        wordBreak: "break-word"
      }}>
        {/* Remote Cursor Flags Overlay */}
        <div style={{ position: "relative", width: "100%", height: 0 }}>
          {Object.entries(remoteCursors).map(([cid, data]) => {
            const user = activeUsers.find((u) => u.client_id === cid);
            if (!user) return null;
            const leftPos = Math.min(650, ((data.cursor?.index || 0) % 40) * 15);

            return (
              <div
                key={cid}
                style={{
                  position: "absolute",
                  top: "-28px",
                  left: `${leftPos}px`,
                  backgroundColor: user.color || "#2563eb",
                  color: "#ffffff",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  pointerEvents: "none",
                  transition: "left 0.15s ease",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem"
                }}
              >
                <span>{user.name}</span>
                <span>✏️</span>
              </div>
            );
          })}
        </div>

        {/* Contenteditable Rich Surface */}
        <div
          ref={editorRef}
          contentEditable={!isReadOnly}
          onInput={handleInput}
          onKeyUp={sendCursorPosition}
          onMouseUp={sendCursorPosition}
          onClick={sendCursorPosition}
          style={{
            flex: 1,
            outline: "none",
            fontSize: "1.05rem",
            lineHeight: "1.85",
            color: "#1e293b",
            fontFamily: "inherit",
            minHeight: "400px",
            wordBreak: "break-word",
            overflowWrap: "break-word"
          }}
          className="rich-document-body"
        />
      </div>
    </div>
  );
}

const toolBtn = (isActive) => ({
  padding: "0.35rem 0.45rem",
  borderRadius: "6px",
  border: isActive ? "1px solid #bfdbfe" : "1px solid transparent",
  backgroundColor: isActive ? "#eff6ff" : "transparent",
  color: isActive ? "#2563eb" : "#475569",
  fontWeight: isActive ? "700" : "500",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s ease",
  boxShadow: isActive ? "0 1px 2px rgba(37, 99, 235, 0.15)" : "none"
});
