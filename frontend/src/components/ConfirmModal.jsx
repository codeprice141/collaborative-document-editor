import React from "react";
import { AlertTriangle, Info, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // "danger" | "primary" | "warning"
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!isOpen) return null;

  const isDanger = type === "danger";

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.6)",
      backdropFilter: "blur(6px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 100,
      padding: "1rem"
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "1.75rem",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        animation: "fadeIn 0.15s ease-out"
      }}>
        {/* Top Icon & Close */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            backgroundColor: isDanger ? "#fee2e2" : "#eff6ff",
            color: isDanger ? "#dc2626" : "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {isDanger ? <AlertTriangle size={22} /> : <Info size={22} />}
          </div>

          <button
            onClick={onCancel}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#94a3b8",
              padding: "4px"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Text Content */}
        <h3 style={{ fontSize: "1.125rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.4rem" }}>
          {title}
        </h3>
        <p style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: "1.5", marginBottom: "1.5rem" }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "0.55rem 1rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#475569",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "0.55rem 1.25rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: isDanger ? "#dc2626" : "#2563eb",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: isDanger
                ? "0 4px 6px -1px rgba(220, 38, 38, 0.25)"
                : "0 4px 6px -1px rgba(37, 99, 235, 0.25)"
            }}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
