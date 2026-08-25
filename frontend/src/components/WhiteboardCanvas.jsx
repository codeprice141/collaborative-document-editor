import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Square,
  Circle,
  Minus,
  ArrowRight,
  Pencil,
  Type,
  MousePointer,
  Undo2,
  Redo2,
  Trash2,
  Download,
  StickyNote,
  Palette
} from "lucide-react";

const PALETTE_COLORS = [
  "#000000",
  "#e11d48",
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#ffffff"
];

export default function WhiteboardCanvas({
  initialData,
  onSaveData,
  onSendDraw,
  registerDrawListener,
  isReadOnly = false
}) {
  const canvasRef = useRef(null);
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedTool, setSelectedTool] = useState("pencil");
  const [strokeColor, setStrokeColor] = useState("#2563eb");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState(null);

  // Initialize Canvas from incoming drawing_data
  useEffect(() => {
    if (initialData) {
      try {
        const parsed = typeof initialData === "string" ? JSON.parse(initialData) : initialData;
        if (Array.isArray(parsed)) {
          setElements(parsed);
          setHistory([parsed]);
          setHistoryIndex(0);
        }
      } catch (e) {
        console.error("Failed to parse initial drawing data", e);
      }
    }
  }, [initialData]);

  // Register remote draw listener
  useEffect(() => {
    if (registerDrawListener) {
      registerDrawListener((payload) => {
        if (payload.elements) {
          try {
            const incoming = typeof payload.elements === "string" ? JSON.parse(payload.elements) : payload.elements;
            if (Array.isArray(incoming)) {
              setElements(incoming);
            }
          } catch (e) {}
        }
      });
    }
  }, [registerDrawListener]);

  const drawAllElements = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid background
    ctx.save();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
    ctx.lineWidth = 1;
    const gridSize = 24;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();

    // Render elements
    const allToRender = currentElement ? [...elements, currentElement] : elements;

    allToRender.forEach((el) => {
      ctx.save();
      ctx.strokeStyle = el.strokeColor || "#000000";
      ctx.lineWidth = el.strokeWidth || 3;
      ctx.fillStyle = el.fillColor || "transparent";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      switch (el.type) {
        case "pencil":
          if (el.points && el.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(el.points[0].x, el.points[0].y);
            for (let i = 1; i < el.points.length; i++) {
              ctx.lineTo(el.points[i].x, el.points[i].y);
            }
            ctx.stroke();
          }
          break;

        case "rectangle":
          ctx.beginPath();
          ctx.strokeRect(el.x, el.y, el.width, el.height);
          if (el.fillColor) ctx.fillRect(el.x, el.y, el.width, el.height);
          break;

        case "circle":
          ctx.beginPath();
          const radius = Math.sqrt(Math.pow(el.width, 2) + Math.pow(el.height, 2)) / 2;
          const centerX = el.x + el.width / 2;
          const centerY = el.y + el.height / 2;
          ctx.arc(centerX, centerY, Math.max(0, radius), 0, 2 * Math.PI);
          ctx.stroke();
          if (el.fillColor) ctx.fill();
          break;

        case "line":
          ctx.beginPath();
          ctx.moveTo(el.x, el.y);
          ctx.lineTo(el.x + el.width, el.y + el.height);
          ctx.stroke();
          break;

        case "arrow":
          const fromX = el.x;
          const fromY = el.y;
          const toX = el.x + el.width;
          const toY = el.y + el.height;
          const headlen = 12;
          const angle = Math.atan2(toY - fromY, toX - fromX);

          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(toX, toY);
          ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fillStyle = el.strokeColor;
          ctx.fill();
          break;

        case "text":
          ctx.font = `${(el.strokeWidth || 3) * 6 + 10}px 'Inter', sans-serif`;
          ctx.fillStyle = el.strokeColor;
          ctx.fillText(el.text || "Text", el.x, el.y);
          break;

        case "sticky":
          ctx.fillStyle = "#fef08a";
          ctx.shadowColor = "rgba(0,0,0,0.15)";
          ctx.shadowBlur = 8;
          ctx.fillRect(el.x, el.y, el.width || 120, el.height || 120);
          ctx.shadowBlur = 0;
          ctx.strokeStyle = "#fde047";
          ctx.strokeRect(el.x, el.y, el.width || 120, el.height || 120);

          ctx.fillStyle = "#0f172a";
          ctx.font = "14px 'Inter', sans-serif";
          ctx.fillText(el.text || "Sticky Note", el.x + 10, el.y + 25);
          break;
      }
      ctx.restore();
    });
  }, [elements, currentElement]);

  useEffect(() => {
    drawAllElements();
  }, [drawAllElements]);

  // Handle Canvas Resizing
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        drawAllElements();
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawAllElements]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleMouseDown = (e) => {
    if (isReadOnly) return;
    const { x, y } = getCanvasCoords(e);
    setIsDrawing(true);

    if (selectedTool === "pencil") {
      setCurrentElement({
        type: "pencil",
        points: [{ x, y }],
        strokeColor,
        strokeWidth,
      });
    } else if (selectedTool === "text") {
      const text = prompt("Enter text for whiteboard:") || "";
      if (text.trim()) {
        const newEl = { type: "text", x, y, text, strokeColor, strokeWidth };
        const nextElements = [...elements, newEl];
        setElements(nextElements);
        commitElements(nextElements);
      }
      setIsDrawing(false);
    } else if (selectedTool === "sticky") {
      const text = prompt("Enter note content:") || "Idea note";
      const newEl = { type: "sticky", x, y, width: 130, height: 110, text, strokeColor };
      const nextElements = [...elements, newEl];
      setElements(nextElements);
      commitElements(nextElements);
      setIsDrawing(false);
    } else {
      setCurrentElement({
        type: selectedTool,
        x,
        y,
        width: 0,
        height: 0,
        strokeColor,
        strokeWidth,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || isReadOnly || !currentElement) return;
    const { x, y } = getCanvasCoords(e);

    if (currentElement.type === "pencil") {
      setCurrentElement((prev) => ({
        ...prev,
        points: [...prev.points, { x, y }],
      }));
    } else {
      setCurrentElement((prev) => ({
        ...prev,
        width: x - prev.x,
        height: y - prev.y,
      }));
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentElement) return;
    setIsDrawing(false);

    const nextElements = [...elements, currentElement];
    setElements(nextElements);
    setCurrentElement(null);
    commitElements(nextElements);
  };

  const commitElements = (newElements) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newElements);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);

    if (onSaveData) onSaveData(JSON.stringify(newElements));
    if (onSendDraw) onSendDraw({ elements: newElements });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      const prevElements = history[nextIdx];
      setHistoryIndex(nextIdx);
      setElements(prevElements);
      if (onSaveData) onSaveData(JSON.stringify(prevElements));
      if (onSendDraw) onSendDraw({ elements: prevElements });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const nextElements = history[nextIdx];
      setHistoryIndex(nextIdx);
      setElements(nextElements);
      if (onSaveData) onSaveData(JSON.stringify(nextElements));
      if (onSendDraw) onSendDraw({ elements: nextElements });
    }
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the whiteboard?")) {
      setElements([]);
      commitElements([]);
    }
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `whiteboard-${Date.now()}.png`;
    a.click();
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", backgroundColor: "var(--bg-primary)" }}>
      {/* Sleek Wrap-Around Floating Canvas Toolbar */}
      {!isReadOnly && (
        <div style={{
          position: "absolute",
          top: "14px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "14px",
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          boxShadow: "var(--shadow-lg)",
          maxWidth: "92vw",
          flexWrap: "wrap",
          justifyContent: "center"
        }}>
          {/* Shape Tools */}
          <div style={{ display: "flex", gap: "2px", borderRight: "1px solid var(--border-color)", paddingRight: "6px" }}>
            <button onClick={() => setSelectedTool("pencil")} style={toolBtn(selectedTool === "pencil")} title="Freehand Pencil">
              <Pencil size={15} />
            </button>
            <button onClick={() => setSelectedTool("rectangle")} style={toolBtn(selectedTool === "rectangle")} title="Rectangle">
              <Square size={15} />
            </button>
            <button onClick={() => setSelectedTool("circle")} style={toolBtn(selectedTool === "circle")} title="Circle">
              <Circle size={15} />
            </button>
            <button onClick={() => setSelectedTool("line")} style={toolBtn(selectedTool === "line")} title="Line">
              <Minus size={15} />
            </button>
            <button onClick={() => setSelectedTool("arrow")} style={toolBtn(selectedTool === "arrow")} title="Arrow">
              <ArrowRight size={15} />
            </button>
            <button onClick={() => setSelectedTool("text")} style={toolBtn(selectedTool === "text")} title="Text Note">
              <Type size={15} />
            </button>
            <button onClick={() => setSelectedTool("sticky")} style={toolBtn(selectedTool === "sticky")} title="Sticky Note">
              <StickyNote size={15} />
            </button>
          </div>

          {/* Color Palette */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px", borderRight: "1px solid var(--border-color)", paddingRight: "6px" }}>
            {PALETTE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setStrokeColor(c)}
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: c,
                  border: strokeColor === c ? "2px solid var(--accent-color)" : "1px solid var(--border-color)",
                  cursor: "pointer",
                  padding: 0
                }}
                title={c}
              />
            ))}
          </div>

          {/* Stroke Width Slider */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", borderRight: "1px solid var(--border-color)", paddingRight: "6px" }}>
            <input
              type="range"
              min="1"
              max="12"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
              style={{ width: "55px", cursor: "pointer" }}
              title={`Stroke Width: ${strokeWidth}px`}
            />
          </div>

          {/* History Controls */}
          <div style={{ display: "flex", gap: "2px" }}>
            <button onClick={handleUndo} disabled={historyIndex <= 0} style={toolBtn(false)} title="Undo">
              <Undo2 size={15} />
            </button>
            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} style={toolBtn(false)} title="Redo">
              <Redo2 size={15} />
            </button>
            <button onClick={handleClear} style={toolBtn(false)} title="Clear Canvas">
              <Trash2 size={15} />
            </button>
            <button onClick={handleExportPNG} style={toolBtn(false)} title="Export PNG">
              <Download size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Main HTML5 2D Vector Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          cursor: selectedTool === "pencil" ? "crosshair" : "default",
          touchAction: "none"
        }}
      />
    </div>
  );
}

const toolBtn = (isActive) => ({
  width: "32px",
  height: "32px",
  borderRadius: "6px",
  border: isActive ? "1px solid var(--accent-color)" : "1px solid transparent",
  backgroundColor: isActive ? "var(--accent-glow)" : "transparent",
  color: isActive ? "var(--accent-color)" : "var(--text-secondary)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s ease"
});
