import React, { useRef, useState, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Highlighter,
  Baseline,
  RemoveFormatting,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MessageSquarePlus,
  ChevronDown,
  Pipette
} from "lucide-react";

const PRESET_TEXT_COLORS = [
  "#000000", "#475569", "#dc2626", "#ea580c", "#d97706",
  "#16a34a", "#0284c7", "#2563eb", "#7c3aed", "#db2777"
];

const PRESET_HIGHLIGHT_COLORS = [
  "#fef08a", "#bbf7d0", "#bae6fd", "#fbcfe8", "#fed7aa",
  "#e9d5ff", "#fecdd3", "#c7d2fe", "#a7f3d0", "#fef9c3"
];

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

  // Color picker popover states
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [customTextColor, setCustomTextColor] = useState("#000000");
  const [customHighlightColor, setCustomHighlightColor] = useState("#fef08a");

  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    blockType: "p",
    ul: false,
    ol: false,
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
      let currentBlock = "p";
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
        blockType: currentBlock,
        ul: isUl,
        ol: isOl,
        justifyLeft: isLeft,
        justifyCenter: isCenter,
        justifyRight: isRight,
      });
    } catch (e) {}
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      updateActiveStyles();
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [isReadOnly]);

  // Sync external incoming content changes without resetting cursor if user is editing
  useEffect(() => {
    if (editorRef.current && htmlContent !== undefined) {
      if (editorRef.current.innerHTML !== htmlContent && !isInternalUpdate.current) {
        editorRef.current.innerHTML = htmlContent;
      }
      isInternalUpdate.current = false;
    }
  }, [htmlContent]);

  const exec = (command, value = null) => {
    if (isReadOnly) return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      isInternalUpdate.current = true;
      onHtmlChange(newHtml);
      editorRef.current.focus();
    }
    updateActiveStyles();
  };

  const handleBlockChange = (e) => {
    const tag = e.target.value;
    exec("formatBlock", tag === "p" ? "<p>" : `<${tag}>`);
  };

  const handleInput = () => {
    if (isReadOnly || !editorRef.current) return;
    const newHtml = editorRef.current.innerHTML;
    isInternalUpdate.current = true;
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

      {/* Google Docs & Linear Grade Formatting Toolbar */}
      {!isReadOnly && (
        <div style={{
          position: "sticky",
          top: "14px",
          zIndex: 20,
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "14px",
          padding: "7px 12px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          boxShadow: "0 10px 25px -4px rgba(0,0,0,0.09), 0 2px 6px -1px rgba(0,0,0,0.04)",
          margin: "0 auto 1.75rem auto",
          width: "fit-content",
          maxWidth: "100%",
          flexWrap: "wrap",
          justifyContent: "center"
        }}>
          {/* Block Type Dropdown (Normal text, H1, H2, H3, Quote, Code) */}
          <div style={{ display: "flex", alignItems: "center", borderRight: "1px solid var(--border-color)", paddingRight: "6px" }}>
            <select
              value={activeStyles.blockType}
              onChange={handleBlockChange}
              style={{
                backgroundColor: "transparent",
                border: "none",
                fontSize: "0.8125rem",
                fontWeight: "600",
                color: "var(--text-primary)",
                cursor: "pointer",
                padding: "4px 6px",
                borderRadius: "6px",
                outline: "none"
              }}
            >
              <option value="p">Normal text</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="blockquote">Quote</option>
              <option value="pre">Code block</option>
            </select>
          </div>

          {/* Text Styles (B, I, U, S) */}
          <div style={{ display: "flex", gap: "2px", borderRight: "1px solid var(--border-color)", paddingRight: "6px", alignItems: "center" }}>
            <button onClick={() => exec("bold")} style={toolBtn(activeStyles.bold)} title="Bold (Ctrl+B)">
              <Bold size={15} />
            </button>
            <button onClick={() => exec("italic")} style={toolBtn(activeStyles.italic)} title="Italic (Ctrl+I)">
              <Italic size={15} />
            </button>
            <button onClick={() => exec("underline")} style={toolBtn(activeStyles.underline)} title="Underline (Ctrl+U)">
              <Underline size={15} />
            </button>
            <button onClick={() => exec("strikeThrough")} style={toolBtn(activeStyles.strikeThrough)} title="Strikethrough">
              <Strikethrough size={15} />
            </button>
          </div>

          {/* Lists, Quote & Code */}
          <div style={{ display: "flex", gap: "2px", borderRight: "1px solid var(--border-color)", paddingRight: "6px", alignItems: "center" }}>
            <button onClick={() => exec("insertUnorderedList")} style={toolBtn(activeStyles.ul)} title="Bullet List">
              <List size={15} />
            </button>
            <button onClick={() => exec("insertOrderedList")} style={toolBtn(activeStyles.ol)} title="Numbered List">
              <ListOrdered size={15} />
            </button>
            <button onClick={() => exec("formatBlock", "<blockquote>")} style={toolBtn(activeStyles.blockType === "blockquote")} title="Quote Block">
              <Quote size={15} />
            </button>
            <button onClick={() => exec("formatBlock", "<pre>")} style={toolBtn(activeStyles.blockType === "pre")} title="Code Block">
              <Code size={15} />
            </button>
          </div>

          {/* Alignment (Left, Center, Right) */}
          <div style={{ display: "flex", gap: "2px", borderRight: "1px solid var(--border-color)", paddingRight: "6px", alignItems: "center" }}>
            <button onClick={() => exec("justifyLeft")} style={toolBtn(activeStyles.justifyLeft)} title="Align Left">
              <AlignLeft size={15} />
            </button>
            <button onClick={() => exec("justifyCenter")} style={toolBtn(activeStyles.justifyCenter)} title="Align Center">
              <AlignCenter size={15} />
            </button>
            <button onClick={() => exec("justifyRight")} style={toolBtn(activeStyles.justifyRight)} title="Align Right">
              <AlignRight size={15} />
            </button>
          </div>

          {/* Text Color Picker Dropdown with Custom Color Picker */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <button
              onClick={() => {
                setShowTextColorPicker(!showTextColorPicker);
                setShowHighlightPicker(false);
              }}
              style={{
                ...toolBtn(showTextColorPicker),
                display: "flex",
                alignItems: "center",
                gap: "2px",
                padding: "0 6px",
                width: "auto"
              }}
              title="Text Color & Custom Picker"
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Baseline size={14} />
                <div style={{ width: "12px", height: "2px", backgroundColor: customTextColor, borderRadius: "1px" }} />
              </div>
              <ChevronDown size={11} />
            </button>

            {showTextColorPicker && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: "6px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "10px",
                boxShadow: "0 12px 30px -5px rgba(0,0,0,0.18)",
                zIndex: 35,
                width: "180px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
                <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  Text Color
                </div>
                {/* Palette Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                  {PRESET_TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        exec("foreColor", color);
                        setCustomTextColor(color);
                        setShowTextColorPicker(false);
                      }}
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        backgroundColor: color,
                        border: "1.5px solid var(--border-color)",
                        cursor: "pointer"
                      }}
                      title={color}
                    />
                  ))}
                </div>
                {/* Custom Color Input */}
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Pipette size={12} /> Custom:
                  </span>
                  <input
                    type="color"
                    value={customTextColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      setCustomTextColor(color);
                      exec("foreColor", color);
                    }}
                    style={{
                      width: "28px",
                      height: "24px",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      backgroundColor: "transparent"
                    }}
                    title="Choose any custom color"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Highlight Color Picker Dropdown with Custom Color Picker */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <button
              onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowTextColorPicker(false);
              }}
              style={{
                ...toolBtn(showHighlightPicker),
                display: "flex",
                alignItems: "center",
                gap: "2px",
                padding: "0 6px",
                width: "auto"
              }}
              title="Highlight Color & Custom Picker"
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Highlighter size={14} />
                <div style={{ width: "12px", height: "2px", backgroundColor: customHighlightColor, borderRadius: "1px" }} />
              </div>
              <ChevronDown size={11} />
            </button>

            {showHighlightPicker && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: "6px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "10px",
                boxShadow: "0 12px 30px -5px rgba(0,0,0,0.18)",
                zIndex: 35,
                width: "180px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
                <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  Highlight Color
                </div>
                {/* Palette Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                  {PRESET_HIGHLIGHT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        exec("hiliteColor", color);
                        setCustomHighlightColor(color);
                        setShowHighlightPicker(false);
                      }}
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        backgroundColor: color,
                        border: "1.5px solid var(--border-color)",
                        cursor: "pointer"
                      }}
                      title={color}
                    />
                  ))}
                </div>
                {/* Custom Highlight Input */}
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Pipette size={12} /> Custom:
                  </span>
                  <input
                    type="color"
                    value={customHighlightColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      setCustomHighlightColor(color);
                      exec("hiliteColor", color);
                    }}
                    style={{
                      width: "28px",
                      height: "24px",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      backgroundColor: "transparent"
                    }}
                    title="Choose any custom highlight color"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Clear Formatting */}
          <div style={{ display: "flex", alignItems: "center", borderLeft: "1px solid var(--border-color)", paddingLeft: "6px" }}>
            <button onClick={() => exec("removeFormat")} style={toolBtn(false)} title="Clear Formatting">
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
  borderRadius: "6px",
  border: isActive ? "1px solid #93c5fd" : "1px solid transparent",
  backgroundColor: isActive ? "#eff6ff" : "transparent",
  color: isActive ? "#2563eb" : "var(--text-secondary)",
  fontWeight: isActive ? "700" : "500",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s ease",
  flexShrink: 0
});
