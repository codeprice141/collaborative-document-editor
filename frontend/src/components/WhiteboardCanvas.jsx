import React, { useRef, useState, useEffect } from "react";
import { Pen, Eraser, RotateCcw, Palette, Download, Sparkles } from "lucide-react";

const COLORS = [
  "#0f172a", // Black
  "#ef4444", // Red
  "#2563eb", // Blue
  "#16a34a", // Green
  "#ea580c", // Orange
  "#9333ea", // Purple
  "#eab308", // Yellow
];

export default function WhiteboardCanvas({ onSendDraw, registerDrawListener, isReadOnly }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#2563eb");
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState("pen"); // "pen" | "eraser" | "highlighter"
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Register remote draw listener
    registerDrawListener((stroke, peerColor, peerName) => {
      if (!ctx) return;
      ctx.save();
      ctx.strokeStyle = stroke.color || peerColor || "#2563eb";
      ctx.lineWidth = stroke.size || 3;
      if (stroke.tool === "highlighter") {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 14;
      } else if (stroke.tool === "eraser") {
        ctx.strokeStyle = "#ffffff";
      } else {
        ctx.globalAlpha = 1.0;
      }

      ctx.beginPath();
      ctx.moveTo(stroke.x0, stroke.y0);
      ctx.lineTo(stroke.x1, stroke.y1);
      ctx.stroke();
      ctx.restore();
    });
  }, []);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    if (isReadOnly) return;
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setLastPos(coords);
  };

  const draw = (e) => {
    if (!isDrawing || isReadOnly) return;
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.save();
    let drawColor = color;
    let size = lineWidth;

    if (tool === "eraser") {
      ctx.strokeStyle = "#ffffff";
      size = 18;
    } else if (tool === "highlighter") {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35;
      size = 14;
    } else {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 1.0;
    }

    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.restore();

    // Broadcast stroke to peers
    onSendDraw({
      x0: lastPos.x,
      y0: lastPos.y,
      x1: coords.x,
      y1: coords.y,
      color: tool === "eraser" ? "#ffffff" : color,
      size,
      tool,
    });

    setLastPos(coords);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (isReadOnly) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "whiteboard-drawing.png";
    link.href = image;
    link.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {/* Floating Toolbar */}
      <div style={{
        position: "absolute", top: "16px", left: "50%", transform: "translateX(-50%)",
        backgroundColor: "#ffffff", padding: "0.5rem 1rem", borderRadius: "12px",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
        display: "flex", alignItems: "center", gap: "0.75rem", zIndex: 10,
        border: "1px solid #e2e8f0"
      }}>
        {/* Tool Selectors */}
        <div style={{ display: "flex", gap: "0.25rem", borderRight: "1px solid #e2e8f0", paddingRight: "0.5rem" }}>
          <button
            onClick={() => setTool("pen")}
            style={{
              padding: "0.4rem", borderRadius: "6px", border: "none", cursor: "pointer",
              backgroundColor: tool === "pen" ? "#eff6ff" : "transparent",
              color: tool === "pen" ? "#2563eb" : "#64748b"
            }}
            title="Pen"
          >
            <Pen size={18} />
          </button>
          <button
            onClick={() => setTool("highlighter")}
            style={{
              padding: "0.4rem", borderRadius: "6px", border: "none", cursor: "pointer",
              backgroundColor: tool === "highlighter" ? "#eff6ff" : "transparent",
              color: tool === "highlighter" ? "#2563eb" : "#64748b"
            }}
            title="Highlighter"
          >
            <Sparkles size={18} />
          </button>
          <button
            onClick={() => setTool("eraser")}
            style={{
              padding: "0.4rem", borderRadius: "6px", border: "none", cursor: "pointer",
              backgroundColor: tool === "eraser" ? "#eff6ff" : "transparent",
              color: tool === "eraser" ? "#2563eb" : "#64748b"
            }}
            title="Eraser"
          >
            <Eraser size={18} />
          </button>
        </div>

        {/* Color Palette */}
        <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", borderRight: "1px solid #e2e8f0", paddingRight: "0.5rem" }}>
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                if (tool === "eraser") setTool("pen");
              }}
              style={{
                width: "20px", height: "20px", borderRadius: "50%",
                backgroundColor: c, border: color === c ? "2px solid #2563eb" : "1px solid #cbd5e1",
                cursor: "pointer", outlineOffset: "2px", transform: color === c ? "scale(1.2)" : "scale(1)",
                transition: "all 0.15s"
              }}
            />
          ))}
        </div>

        {/* Stroke Size */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderRight: "1px solid #e2e8f0", paddingRight: "0.5rem" }}>
          <input
            type="range"
            min={1}
            max={12}
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value, 10))}
            style={{ width: "60px", cursor: "pointer" }}
            title="Brush Size"
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.25rem" }}>
          <button
            onClick={clearCanvas}
            style={{ padding: "0.4rem", borderRadius: "6px", border: "none", cursor: "pointer", color: "#64748b", background: "none" }}
            title="Clear Board"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={downloadCanvas}
            style={{ padding: "0.4rem", borderRadius: "6px", border: "none", cursor: "pointer", color: "#64748b", background: "none" }}
            title="Download PNG"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Drawing Canvas */}
      <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", margin: "1rem" }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{ width: "100%", height: "100%", cursor: tool === "eraser" ? "cell" : "crosshair", display: "block" }}
        />
      </div>
    </div>
  );
}
