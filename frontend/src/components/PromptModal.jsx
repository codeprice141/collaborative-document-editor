import React, { useState } from "react";
import { Type, X } from "lucide-react";

export default function PromptModal({
  isOpen,
  title = "Enter Text",
  placeholder = "Type something...",
  confirmText = "Add Text",
  onConfirm,
  onCancel,
}) {
  const [value, setValue] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
      setValue("");
    }
  };

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
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Type size={18} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>{title}</h3>
          </div>
          <button onClick={onCancel} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            required
            style={{
              width: "100%",
              padding: "0.65rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.95rem",
              marginBottom: "1.25rem",
              outline: "none"
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: "0.55rem 1rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#64748b",
                fontWeight: "500",
                fontSize: "0.875rem",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "0.55rem 1.25rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "0.875rem",
                cursor: "pointer"
              }}
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
