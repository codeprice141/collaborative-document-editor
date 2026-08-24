import React, { useRef, useState, useEffect } from "react";
import ConfirmModal from "./ConfirmModal";
import PromptModal from "./PromptModal";
import {
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
  PaintBucket
} from "lucide-react";

const COLORS = [
  "#0f172a", // Black
  "#ef4444", // Red
  "#2563eb", // Blue
  "#16a34a", // Green
  "#f59e0b", // Yellow/Amber
  "#9333ea", // Purple
  "#ea580c", // Orange
  "#06b6d4", // Cyan
];

export default function WhiteboardCanvas({
  initialData = "[]",
  onSaveData,
  onSendDraw,
  registerDrawListener,
  isReadOnly
}) {
  const canvasRef = useRef(null);
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#2563eb");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isFilled, setIsFilled] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState(null);

  // Custom Modals State
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [textPromptData, setTextPromptData] = useState(null); // { x, y }

  // Load persistent elements on startup
  useEffect(() => {
    try {
      const parsed = typeof initialData === "string" ? JSON.parse(initialData || "[]") : initialData;
      if (Array.isArray(parsed) && parsed.length > 0) {
        setElements(parsed);
      }
    } catch (err) {
      console.error("Failed to parse initial drawing elements:", err);
    }
  }, [initialData]);

  // Handle incoming remote drawings
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

  // Redraw canvas whenever elements or currentShape changes
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

    const allToRender = currentShape ? [...elements, currentShape] : elements;

    allToRender.forEach((el) => {
      ctx.save();
      ctx.strokeStyle = el.color || "#0f172a";
      ctx.fillStyle = el.color || "#0f172a";
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

      ctx.restore();
    });
  }, [elements, currentShape]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e) => {
    if (isReadOnly) return;
    const coords = getCanvasCoords(e);

    if (tool === "text") {
      setTextPromptData(coords);
      return;
    }

    setIsDrawing(true);

    if (tool === "pen" || tool === "highlighter") {
      setCurrentShape({
        id: "elem_" + Date.now(),
        tool,
        color,
        strokeWidth,
        points: [coords],
      });
    } else if (tool === "eraser") {
      setElements((prev) =>
        prev.filter((el) => {
          if (el.points) {
            return !el.points.some((p) => Math.hypot(p.x - coords.x, p.y - coords.y) < 15);
          }
          return Math.hypot((el.x1 || 0) - coords.x, (el.y1 || 0) - coords.y) > 30;
        })
      );
    } else {
      setCurrentShape({
        id: "elem_" + Date.now(),
        tool,
        color,
        strokeWidth,
        isFilled,
        x1: coords.x,
        y1: coords.y,
        x2: coords.x,
        y2: coords.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || isReadOnly || !currentShape) return;
    const coords = getCanvasCoords(e);

    if (tool === "pen" || tool === "highlighter") {
      setCurrentShape((prev) => ({
        ...prev,
        points: [...prev.points, coords],
      }));
    } else {
      setCurrentShape((prev) => ({
        ...prev,
        x2: coords.x,
        y2: coords.y,
      }));
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentShape) return;
    setIsDrawing(false);
    commitNewElement(currentShape);
    setCurrentShape(null);
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
      {/* Floating Toolbar */}
      <div style={{
        position: "absolute", top: "16px", left: "50%", transform: "translateX(-50%)",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        padding: "0.4rem 0.8rem", borderRadius: "14px",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
        display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 10,
        border: "1px solid #e2e8f0"
      }}>
        {/* Shape & Tool Selectors */}
        <div style={{ display: "flex", gap: "2px", borderRight: "1px solid #e2e8f0", paddingRight: "0.5rem" }}>
          <button onClick={() => setTool("pen")} style={toolBtn(tool === "pen")} title="Pen">
            <Pen size={17} />
          </button>
          <button onClick={() => setTool("highlighter")} style={toolBtn(tool === "highlighter")} title="Highlighter">
            <Highlighter size={17} />
          </button>
          <button onClick={() => setTool("rect")} style={toolBtn(tool === "rect")} title="Rectangle">
            <Square size={17} />
          </button>
          <button onClick={() => setTool("circle")} style={toolBtn(tool === "circle")} title="Circle / Ellipse">
            <Circle size={17} />
          </button>
          <button onClick={() => setTool("arrow")} style={toolBtn(tool === "arrow")} title="Arrow">
            <ArrowRight size={17} />
          </button>
          <button onClick={() => setTool("line")} style={toolBtn(tool === "line")} title="Line">
            <Minus size={17} />
          </button>
          <button onClick={() => setTool("text")} style={toolBtn(tool === "text")} title="Text Box">
            <Type size={17} />
          </button>
          <button onClick={() => setTool("eraser")} style={toolBtn(tool === "eraser")} title="Eraser">
            <Eraser size={17} />
          </button>
        </div>

        {/* Color Palette */}
        <div style={{ display: "flex", gap: "5px", alignItems: "center", borderRight: "1px solid #e2e8f0", paddingRight: "0.5rem" }}>
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: "18px", height: "18px", borderRadius: "50%",
                backgroundColor: c, border: color === c ? "2px solid #2563eb" : "1px solid #cbd5e1",
                cursor: "pointer", transform: color === c ? "scale(1.25)" : "scale(1)",
                transition: "all 0.15s"
              }}
            />
          ))}
          <button
            onClick={() => setIsFilled(!isFilled)}
            style={{
              padding: "4px", borderRadius: "6px", border: "1px solid #e2e8f0",
              backgroundColor: isFilled ? "#eff6ff" : "transparent",
              color: isFilled ? "#2563eb" : "#64748b", cursor: "pointer", marginLeft: "2px"
            }}
            title={isFilled ? "Filled Shape Active" : "Transparent Shape"}
          >
            <PaintBucket size={15} />
          </button>
        </div>

        {/* Stroke Width */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", borderRight: "1px solid #e2e8f0", paddingRight: "0.5rem" }}>
          <input
            type="range"
            min={1}
            max={8}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
            style={{ width: "50px", cursor: "pointer" }}
            title="Stroke Width"
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "2px" }}>
          <button onClick={undo} disabled={history.length === 0} style={toolBtn(false)} title="Undo (Ctrl+Z)">
            <Undo2 size={16} />
          </button>
          <button onClick={redo} disabled={redoStack.length === 0} style={toolBtn(false)} title="Redo (Ctrl+Y)">
            <Redo2 size={16} />
          </button>
          <button onClick={() => setShowClearConfirm(true)} style={toolBtn(false)} title="Clear Whiteboard">
            <RotateCcw size={16} />
          </button>
          <button onClick={downloadPNG} style={toolBtn(false)} title="Download PNG">
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div style={{
        flex: 1, backgroundColor: "#ffffff", borderRadius: "14px",
        border: "1px solid #e2e8f0", overflow: "hidden", margin: "1rem",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
      }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ width: "100%", height: "100%", cursor: tool === "eraser" ? "cell" : tool === "text" ? "text" : "crosshair", display: "block" }}
        />
      </div>

      {/* Custom Clear Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear Entire Whiteboard?"
        message="This will wipe all shapes, notes, and strokes from this whiteboard for all collaborators."
        confirmText="Clear Whiteboard"
        type="danger"
        onConfirm={handleConfirmClearBoard}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* Custom Text Prompt Modal */}
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
  padding: "0.4rem",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  backgroundColor: isActive ? "#eff6ff" : "transparent",
  color: isActive ? "#2563eb" : "#64748b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s"
});
