import React, { useRef, useEffect } from "react";
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
    }
  };

  const handleInput = () => {
    if (isReadOnly || !editorRef.current) return;
    isInternalUpdate.current = true;
    const newHtml = editorRef.current.innerHTML;
    onHtmlChange(newHtml);
    sendCursorPosition();
  };

  const sendCursorPosition = () => {
    if (isReadOnly || !onCursorChange) return;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      onCursorChange(range.startOffset);
    }
  };

  const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bae6fd", "#fbcfe8", "#fed7aa"];

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", alignItems: "center" }}>
      {/* Sticky Rich Formatting Toolbar */}
      {!isReadOnly && (
        <div style={{
          position: "sticky", top: "0px", zIndex: 20,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(8px)",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "0.4rem 0.6rem",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)",
          marginBottom: "1.25rem",
          flexWrap: "wrap"
        }}>
          {/* Text Style Section */}
          <div style={{ display: "flex", gap: "2px", borderRight: "1px solid #e2e8f0", paddingRight: "0.4rem" }}>
            <button
              onClick={() => exec("bold")}
              style={toolBtnStyle}
              title="Bold (Ctrl+B)"
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => exec("italic")}
              style={toolBtnStyle}
              title="Italic (Ctrl+I)"
            >
              <Italic size={16} />
            </button>
            <button
              onClick={() => exec("underline")}
              style={toolBtnStyle}
              title="Underline (Ctrl+U)"
            >
              <Underline size={16} />
            </button>
            <button
              onClick={() => exec("strikeThrough")}
              style={toolBtnStyle}
              title="Strikethrough"
            >
              <Strikethrough size={16} />
            </button>
          </div>

          {/* Headings Section */}
          <div style={{ display: "flex", gap: "2px", borderRight: "1px solid #e2e8f0", paddingRight: "0.4rem" }}>
            <button
              onClick={() => exec("formatBlock", "<h1>")}
              style={toolBtnStyle}
              title="Heading 1"
            >
              <Heading1 size={16} />
            </button>
            <button
              onClick={() => exec("formatBlock", "<h2>")}
              style={toolBtnStyle}
              title="Heading 2"
            >
              <Heading2 size={16} />
            </button>
            <button
              onClick={() => exec("formatBlock", "<h3>")}
              style={toolBtnStyle}
              title="Heading 3"
            >
              <Heading3 size={16} />
            </button>
            <button
              onClick={() => exec("formatBlock", "<p>")}
              style={toolBtnStyle}
              title="Normal Paragraph"
            >
              P
            </button>
          </div>

          {/* Lists Section */}
          <div style={{ display: "flex", gap: "2px", borderRight: "1px solid #e2e8f0", paddingRight: "0.4rem" }}>
            <button
              onClick={() => exec("insertUnorderedList")}
              style={toolBtnStyle}
              title="Bullet List"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => exec("insertOrderedList")}
              style={toolBtnStyle}
              title="Numbered List"
            >
              <ListOrdered size={16} />
            </button>
            <button
              onClick={() => exec("formatBlock", "<blockquote>")}
              style={toolBtnStyle}
              title="Quote Block"
            >
              <Quote size={16} />
            </button>
            <button
              onClick={() => exec("formatBlock", "<pre>")}
              style={toolBtnStyle}
              title="Code Block"
            >
              <Code size={16} />
            </button>
          </div>

          {/* Alignment */}
          <div style={{ display: "flex", gap: "2px", borderRight: "1px solid #e2e8f0", paddingRight: "0.4rem" }}>
            <button onClick={() => exec("justifyLeft")} style={toolBtnStyle} title="Align Left">
              <AlignLeft size={16} />
            </button>
            <button onClick={() => exec("justifyCenter")} style={toolBtnStyle} title="Align Center">
              <AlignCenter size={16} />
            </button>
            <button onClick={() => exec("justifyRight")} style={toolBtnStyle} title="Align Right">
              <AlignRight size={16} />
            </button>
          </div>

          {/* Highlights */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", paddingLeft: "0.2rem" }}>
            <Highlighter size={14} color="#64748b" />
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => exec("hiliteColor", c)}
                style={{
                  width: "16px", height: "16px", borderRadius: "50%",
                  backgroundColor: c, border: "1px solid #cbd5e1",
                  cursor: "pointer", padding: 0
                }}
                title="Highlight Color"
              />
            ))}
            <button
              onClick={() => exec("removeFormat")}
              style={{ ...toolBtnStyle, marginLeft: "4px" }}
              title="Clear Formatting"
            >
              <RemoveFormatting size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Main Notion-Style Document Page */}
      <div style={{
        width: "100%", maxWidth: "850px", minHeight: "850px",
        backgroundColor: "#ffffff", borderRadius: "12px",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.02)",
        padding: "3.5rem 4rem", position: "relative",
        border: "1px solid #e2e8f0", display: "flex", flexDirection: "column"
      }}>
        {/* Remote Cursors Flags Overlay */}
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

        {/* Contenteditable Document Surface */}
        <div
          ref={editorRef}
          contentEditable={!isReadOnly}
          onInput={handleInput}
          onKeyUp={sendCursorPosition}
          onMouseUp={sendCursorPosition}
          style={{
            flex: 1,
            outline: "none",
            fontSize: "1.05rem",
            lineHeight: "1.8",
            color: "#1e293b",
            fontFamily: "inherit",
            minHeight: "700px"
          }}
          className="rich-document-body"
        />
      </div>
    </div>
  );
}

const toolBtnStyle = {
  padding: "0.35rem 0.45rem",
  borderRadius: "6px",
  border: "none",
  backgroundColor: "transparent",
  color: "#475569",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s"
};
