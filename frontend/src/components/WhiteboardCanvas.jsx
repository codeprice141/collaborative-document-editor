import React, { useRef, useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import ConfirmModal from "./ConfirmModal";
import PromptModal from "./PromptModal";
import {
  MousePointer,
  Pen,
  Highlighter,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Type,
  Eraser,
  Undo2,
  Redo2,
  RotateCcw,
  Download,
  PaintBucket,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Trash2
} from "lucide-react";

const COLORS = [
  "#0f172a", // Black
  "#ffffff", // White
  "#ef4444", // Red
  "#2563eb", // Blue
  "#16a34a", // Green
  "#f59e0b", // Amber
  "#9333ea", // Purple
  "#ea580c", // Orange
];

export default function WhiteboardCanvas({
  initialData = "[]",
  onSaveData,
  onSendDraw,
  registerDrawListener,
  isReadOnly
}) {
  const { isDark } = useTheme();
  const canvasRef = useRef(null);
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [tool, setTool] = useState("select");
  const [color, setColor] = useState(isDark ? "#ffffff" : "#2563eb");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isFilled, setIsFilled] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // Pan & Zoom 2D Transformation State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Shape Creation & Selection State
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [isDraggingSelected, setIsDraggingSelected] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  // Custom Modals State
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [textPromptData, setTextPromptData] = useState(null);

  useEffect(() => {
    try {
      const parsed = typeof initialData === "string" ? JSON.parse(initialData || "[]") : initialData;
      if (Array.isArray(parsed) && parsed.length > 0) {
        setElements(parsed);
      }
    } catch (err) {
      console.error("Failed to parse drawing data:", err);
    }
  }, [initialData]);

  useEffect(() => {
    if (registerDrawListener) {
      registerDrawListener((drawPayload) => {
        if (drawPayload.elements) {
          try {
            const remoteElems = typeof drawPayload.elements === "string"
              ? JSON.parse(drawPayload.elements)
              : drawPayload.elements;
            setElements(remoteElems);
          } catch (e) {}
        } else if (drawPayload.stroke) {
          setElements((prev) => [...prev, drawPayload.stroke]);
        }
      });
    }
  }, [registerDrawListener]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && !isReadOnly) {
          deleteSelectedElement();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, isReadOnly, elements]);

  const screenToCanvas = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom,
    };
  };

  const getHitElement = (pt) => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.tool === "rect") {
        const minX = Math.min(el.x1, el.x2) - 5;
        const maxX = Math.max(el.x1, el.x2) + 5;
        const minY = Math.min(el.y1, el.y2) - 5;
        const maxY = Math.max(el.y1, el.y2) + 5;
        if (pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY) return el;
      } else if (el.tool === "circle") {
        const rx = Math.abs(el.x2 - el.x1) / 2;
        const ry = Math.abs(el.y2 - el.y1) / 2;
        const cx = Math.min(el.x1, el.x2) + rx;
        const cy = Math.min(el.y1, el.y2) + ry;
        if (Math.hypot(pt.x - cx, pt.y - cy) <= Math.max(rx, ry) + 10) return el;
      } else if (el.tool === "text") {
        if (Math.hypot(pt.x - el.x1, pt.y - el.y1) < 40) return el;
      } else if (el.points) {
        if (el.points.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < 15)) return el;
      }
    }
    return null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.fillStyle = isDark ? "#131b2e" : "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 1. Draw Dot Grid Background
    if (showGrid) {
      ctx.save();
      ctx.fillStyle = isDark ? "#334155" : "#cbd5e1";
      const gridSize = 24 * zoom;
      const startX = (pan.x % gridSize);
      const startY = (pan.y % gridSize);
      for (let x = startX; x < rect.width; x += gridSize) {
        for (let y = startY; y < rect.height; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 2. Apply Pan and Zoom Matrix
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const allToRender = currentShape ? [...elements, currentShape] : elements;

    allToRender.forEach((el) => {
      ctx.save();
      ctx.strokeStyle = el.color || (isDark ? "#f8fafc" : "#0f172a");
      ctx.fillStyle = el.color || (isDark ? "#f8fafc" : "#0f172a");
      ctx.lineWidth = el.strokeWidth || 3;

      if (el.tool === "highlighter") {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 14;
      }

      if (el.tool === "pen" || el.tool === "highlighter" || el.type === "stroke") {
        if (el.points && el.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          ctx.stroke();
        }
      } else if (el.tool === "rect") {
        const x = Math.min(el.x1, el.x2);
        const y = Math.min(el.y1, el.y2);
        const w = Math.abs(el.x2 - el.x1);
        const h = Math.abs(el.y2 - el.y1);
        if (el.isFilled) {
          ctx.globalAlpha = 0.2;
          ctx.fillRect(x, y, w, h);
          ctx.globalAlpha = 1.0;
        }
        ctx.strokeRect(x, y, w, h);
      } else if (el.tool === "circle") {
        const rx = Math.abs(el.x2 - el.x1) / 2;
        const ry = Math.abs(el.y2 - el.y1) / 2;
        const cx = Math.min(el.x1, el.x2) + rx;
        const cy = Math.min(el.y1, el.y2) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, 2 * Math.PI);
        if (el.isFilled) {
          ctx.globalAlpha = 0.2;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
        ctx.stroke();
      } else if (el.tool === "line") {
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();
      } else if (el.tool === "arrow") {
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();

        const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
        const headlen = 12;
        ctx.beginPath();
        ctx.moveTo(el.x2, el.y2);
        ctx.lineTo(el.x2 - headlen * Math.cos(angle - Math.PI / 6), el.y2 - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(el.x2, el.y2);
        ctx.lineTo(el.x2 - headlen * Math.cos(angle + Math.PI / 6), el.y2 - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (el.tool === "text") {
        ctx.font = `${(el.strokeWidth || 3) * 6 + 12}px sans-serif`;
        ctx.fillText(el.text || "", el.x1, el.y1);
      }

      // Selection Bounding Box
      if (el.id === selectedId) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([4, 4]);

        let minX = 0, minY = 0, maxX = 0, maxY = 0;
        if (el.x1 !== undefined && el.x2 !== undefined) {
          minX = Math.min(el.x1, el.x2) - 8;
          maxX = Math.max(el.x1, el.x2) + 8;
          minY = Math.min(el.y1, el.y2) - 8;
          maxY = Math.max(el.y1, el.y2) + 8;
        } else if (el.points) {
          minX = Math.min(...el.points.map((p) => p.x)) - 8;
          maxX = Math.max(...el.points.map((p) => p.x)) + 8;
          minY = Math.min(...el.points.map((p) => p.y)) - 8;
          maxY = Math.max(...el.points.map((p) => p.y)) + 8;
        }

        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      }

      ctx.restore();
    });

    ctx.restore();
  }, [elements, currentShape, pan, zoom, showGrid, selectedId, isDark]);

  const handleMouseDown = (e) => {
    if (e.button === 1 || e.spaceKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (isReadOnly) return;
    const pt = screenToCanvas(e.clientX, e.clientY);

    if (tool === "select") {
      const hit = getHitElement(pt);
      if (hit) {
        setSelectedId(hit.id);
        setIsDraggingSelected(true);
        setDragStartPos(pt);
      } else {
        setSelectedId(null);
      }
      return;
    }

    if (tool === "text") {
      setTextPromptData(pt);
      return;
    }

    setIsDrawing(true);

    if (tool === "pen" || tool === "highlighter") {
      setCurrentShape({
        id: "elem_" + Date.now(),
        tool,
        color,
        strokeWidth,
        points: [pt],
      });
    } else if (tool === "eraser") {
      setElements((prev) =>
        prev.filter((el) => {
          if (el.points) {
            return !el.points.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < 20);
          }
          return Math.hypot((el.x1 || 0) - pt.x, (el.y1 || 0) - pt.y) > 30;
        })
      );
    } else {
      setCurrentShape({
        id: "elem_" + Date.now(),
        tool,
        color,
        strokeWidth,
        isFilled,
        x1: pt.x,
        y1: pt.y,
        x2: pt.x,
        y2: pt.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (isDraggingSelected && selectedId) {
      const pt = screenToCanvas(e.clientX, e.clientY);
      const dx = pt.x - dragStartPos.x;
      const dy = pt.y - dragStartPos.y;
      setDragStartPos(pt);

      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedId) return el;
          if (el.points) {
            return { ...el, points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
          }
          return {
            ...el,
            x1: el.x1 + dx,
            y1: el.y1 + dy,
            x2: el.x2 + dx,
            y2: el.y2 + dy,
          };
        })
      );
      return;
    }

    if (!isDrawing || isReadOnly || !currentShape) return;
    const pt = screenToCanvas(e.clientX, e.clientY);

    if (tool === "pen" || tool === "highlighter") {
      setCurrentShape((prev) => ({
        ...prev,
        points: [...prev.points, pt],
      }));
    } else {
      setCurrentShape((prev) => ({
        ...prev,
        x2: pt.x,
        y2: pt.y,
      }));
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDraggingSelected) {
      setIsDraggingSelected(false);
      if (onSendDraw) onSendDraw({ elements });
      if (onSaveData) onSaveData(JSON.stringify(elements));
      return;
    }

    if (!isDrawing || !currentShape) return;
    setIsDrawing(false);
    commitNewElement(currentShape);
    setCurrentShape(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(3.0, Math.max(0.4, zoom * zoomFactor));
    setZoom(newZoom);
  };

  const commitNewElement = (el) => {
    const updated = [...elements, el];
    setHistory((prev) => [...prev, elements]);
    setRedoStack([]);
    setElements(updated);

    if (onSendDraw) {
      onSendDraw({ elements: updated, stroke: el });
    }
    if (onSaveData) {
      onSaveData(JSON.stringify(updated));
    }
  };

  const deleteSelectedElement = () => {
    if (!selectedId) return;
    const updated = elements.filter((el) => el.id !== selectedId);
    setHistory((prev) => [...prev, elements]);
    setElements(updated);
    setSelectedId(null);
    if (onSendDraw) onSendDraw({ elements: updated });
    if (onSaveData) onSaveData(JSON.stringify(updated));
  };

  const handleAddTextPrompt = (text) => {
    if (textPromptData && text) {
      const newEl = {
        id: "elem_" + Date.now(),
        tool: "text",
        text,
        color,
        strokeWidth,
        x1: textPromptData.x,
        y1: textPromptData.y,
      };
      commitNewElement(newEl);
    }
    setTextPromptData(null);
  };

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [elements, ...prev]);
    setHistory((prev) => prev.slice(0, -1));
    setElements(previous);
    if (onSendDraw) onSendDraw({ elements: previous });
    if (onSaveData) onSaveData(JSON.stringify(previous));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory((prev) => [...prev, elements]);
    setRedoStack((prev) => prev.slice(1));
    setElements(next);
    if (onSendDraw) onSendDraw({ elements: next });
    if (onSaveData) onSaveData(JSON.stringify(next));
  };

  const handleConfirmClearBoard = () => {
    setHistory((prev) => [...prev, elements]);
    setElements([]);
    setSelectedId(null);
    setShowClearConfirm(false);
    if (onSendDraw) onSendDraw({ elements: [] });
    if (onSaveData) onSaveData("[]");
  };

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {/* Smart Responsive Floating Toolbar - Never awkwardly scrolls horizontally! */}
      <div style={{
        position: "absolute", top: "12px", left: "50%", transform: "translateX(-50%)",
        backgroundColor: "var(--bg-surface-glass)",
        backdropFilter: "blur(12px)",
        padding: "0.4rem 0.65rem", borderRadius: "16px",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
        display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "0.45rem", zIndex: 10,
        border: "1px solid var(--border-color)",
        maxWidth: "96%",
      }}>
        {/* Tier 1: Shape Tools */}
        <div style={{ display: "flex", gap: "2px", alignItems: "center", borderRight: "1px solid var(--border-color)", paddingRight: "0.4rem" }}>
          <button onClick={() => setTool("select")} style={toolBtn(tool === "select")} title="Select / Move Shape">
            <MousePointer size={16} />
          </button>
          <button onClick={() => setTool("pen")} style={toolBtn(tool === "pen")} title="Pen">
            <Pen size={16} />
          </button>
          <button onClick={() => setTool("highlighter")} style={toolBtn(tool === "highlighter")} title="Highlighter">
            <Highlighter size={16} />
          </button>
          <button onClick={() => setTool("rect")} style={toolBtn(tool === "rect")} title="Rectangle">
            <Square size={16} />
          </button>
          <button onClick={() => setTool("circle")} style={toolBtn(tool === "circle")} title="Circle">
            <Circle size={16} />
          </button>
          <button onClick={() => setTool("arrow")} style={toolBtn(tool === "arrow")} title="Arrow">
            <ArrowRight size={16} />
          </button>
          <button onClick={() => setTool("line")} style={toolBtn(tool === "line")} title="Line">
            <Minus size={16} />
          </button>
          <button onClick={() => setTool("text")} style={toolBtn(tool === "text")} title="Text Box">
            <Type size={16} />
          </button>
          <button onClick={() => setTool("eraser")} style={toolBtn(tool === "eraser")} title="Eraser">
            <Eraser size={16} />
          </button>
        </div>

        {/* Tier 2: Color Palette & Stroke */}
        <div style={{ display: "flex", gap: "4px", alignItems: "center", borderRight: "1px solid var(--border-color)", paddingRight: "0.4rem" }}>
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: "16px", height: "16px", borderRadius: "50%",
                backgroundColor: c, border: color === c ? "2px solid #3b82f6" : "1px solid var(--border-color)",
                cursor: "pointer", transform: color === c ? "scale(1.25)" : "scale(1)",
                transition: "all 0.15s"
              }}
            />
          ))}
          <button
            onClick={() => setIsFilled(!isFilled)}
            style={{
              padding: "3px", borderRadius: "6px", border: "1px solid var(--border-color)",
              backgroundColor: isFilled ? "#eff6ff" : "transparent",
              color: isFilled ? "#2563eb" : "var(--text-secondary)", cursor: "pointer", marginLeft: "2px"
            }}
            title={isFilled ? "Filled Shape" : "Transparent Shape"}
          >
            <PaintBucket size={14} />
          </button>
          <input
            type="range"
            min={1}
            max={8}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
            style={{ width: "40px", cursor: "pointer" }}
            title="Stroke Width"
          />
        </div>

        {/* Tier 3: Actions & History */}
        <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
          {selectedId && (
            <button onClick={deleteSelectedElement} style={{ ...toolBtn(false), color: "#dc2626" }} title="Delete Selected">
              <Trash2 size={15} />
            </button>
          )}
          <button onClick={undo} disabled={history.length === 0} style={toolBtn(false)} title="Undo">
            <Undo2 size={15} />
          </button>
          <button onClick={redo} disabled={redoStack.length === 0} style={toolBtn(false)} title="Redo">
            <Redo2 size={15} />
          </button>
          <button onClick={() => setShowClearConfirm(true)} style={toolBtn(false)} title="Clear Whiteboard">
            <RotateCcw size={15} />
          </button>
          <button onClick={downloadPNG} style={toolBtn(false)} title="Download PNG">
            <Download size={15} />
          </button>
        </div>
      </div>

      {/* Bottom-Left Zoom & Grid Controls */}
      <div style={{
        position: "absolute", bottom: "16px", left: "16px", zIndex: 10,
        backgroundColor: "var(--bg-surface-glass)",
        backdropFilter: "blur(8px)",
        borderRadius: "10px", padding: "3px 6px",
        display: "flex", alignItems: "center", gap: "4px",
        border: "1px solid var(--border-color)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
      }}>
        <button onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))} style={zoomBtn} title="Zoom Out">
          <ZoomOut size={13} />
        </button>
        <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--text-primary)", minWidth: "32px", textAlign: "center" }}>
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={() => setZoom((z) => Math.min(3.0, z + 0.1))} style={zoomBtn} title="Zoom In">
          <ZoomIn size={13} />
        </button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} style={zoomBtn} title="Reset View">
          <Maximize2 size={12} />
        </button>
        <div style={{ width: "1px", height: "12px", backgroundColor: "var(--border-color)", margin: "0 2px" }} />
        <button
          onClick={() => setShowGrid(!showGrid)}
          style={{ ...zoomBtn, color: showGrid ? "#2563eb" : "var(--text-secondary)" }}
          title="Toggle Grid"
        >
          <Grid size={13} />
        </button>
      </div>

      {/* Canvas Viewport */}
      <div
        style={{
          flex: 1, backgroundColor: "var(--bg-surface)", borderRadius: "14px",
          border: "1px solid var(--border-color)", overflow: "hidden", margin: "0.75rem",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
        }}
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            width: "100%",
            height: "100%",
            cursor: isPanning ? "grab" : tool === "select" ? "default" : tool === "eraser" ? "cell" : tool === "text" ? "text" : "crosshair",
            display: "block"
          }}
        />
      </div>

      {/* Clear Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear Entire Whiteboard?"
        message="This will wipe all shapes, notes, and strokes from this whiteboard for all collaborators."
        confirmText="Clear Whiteboard"
        type="danger"
        onConfirm={handleConfirmClearBoard}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* Text Prompt Modal */}
      <PromptModal
        isOpen={!!textPromptData}
        title="Add Text Note"
        placeholder="Type text note for whiteboard..."
        confirmText="Add Note"
        onConfirm={handleAddTextPrompt}
        onCancel={() => setTextPromptData(null)}
      />
    </div>
  );
}

const toolBtn = (isActive) => ({
  padding: "0.35rem",
  borderRadius: "7px",
  border: "none",
  cursor: "pointer",
  backgroundColor: isActive ? "#eff6ff" : "transparent",
  color: isActive ? "#2563eb" : "var(--text-secondary)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s"
});

const zoomBtn = {
  border: "none",
  background: "none",
  cursor: "pointer",
  color: "var(--text-secondary)",
  padding: "3px",
  borderRadius: "4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};
