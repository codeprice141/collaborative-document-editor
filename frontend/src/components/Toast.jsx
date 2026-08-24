import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function Toast({ message, type = "success", onClose }) {
  if (!message) return null;

  const bg = type === "success" ? "#f0fdf4" : type === "error" ? "#fef2f2" : "#eff6ff";
  const border = type === "success" ? "#bbf7d0" : type === "error" ? "#fecaca" : "#bfdbfe";
  const text = type === "success" ? "#166534" : type === "error" ? "#991b1b" : "#1e40af";

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      left: "24px",
      zIndex: 100,
      backgroundColor: bg,
      border: `1px solid ${border}`,
      color: text,
      padding: "0.6rem 1rem",
      borderRadius: "12px",
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
      display: "flex",
      alignItems: "center",
      gap: "0.6rem",
      fontSize: "0.875rem",
      fontWeight: "600",
      animation: "slideInUp 0.2s ease-out"
    }}>
      {type === "success" && <CheckCircle2 size={18} color="#16a34a" />}
      {type === "error" && <AlertCircle size={18} color="#dc2626" />}
      {type === "info" && <Info size={18} color="#2563eb" />}
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ border: "none", background: "none", cursor: "pointer", color: text, padding: "2px", marginLeft: "4px" }}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
