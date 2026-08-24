import React, { useState, useEffect, useRef } from "react";
import { Users, UserPlus, ChevronUp, ChevronDown } from "lucide-react";

export default function CollaboratorDock({
  activeUsers = [],
  allCollaborators = [],
  typingUsers = [],
  onOpenShare
}) {
  const [expanded, setExpanded] = useState(false);
  const dockRef = useRef(null);

  // Auto-close popover when clicking anywhere outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dockRef.current && !dockRef.current.contains(e.target)) {
        setExpanded(false);
      }
    };
    if (expanded) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [expanded]);

  return (
    <div
      ref={dockRef}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "0.5rem"
      }}
    >
      {/* Expanded Collaborators Popover */}
      {expanded && (
        <div style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "14px",
          padding: "1rem",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
          width: "260px",
          animation: "fadeIn 0.15s ease-out"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: "700", color: "var(--text-primary)" }}>
              Active in Room ({activeUsers.length})
            </span>
            <button
              onClick={() => {
                setExpanded(false);
                if (onOpenShare) onOpenShare();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.25rem 0.5rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#eff6ff",
                color: "#2563eb",
                fontSize: "0.75rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              <UserPlus size={12} />
              <span>Invite</span>
            </button>
          </div>

          {/* Active Users List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "160px", overflowY: "auto" }}>
            {activeUsers.length === 0 ? (
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Only you are currently active</span>
            ) : (
              activeUsers.map((u) => (
                <div key={u.client_id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: u.color || "#3b82f6",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: "700"
                  }}>
                    {u.name?.charAt(0) || "U"}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: "0.8125rem", fontWeight: "600", color: "var(--text-primary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {u.name}
                    </div>
                  </div>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#16a34a" }} />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Compact Avatar Dock */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          backgroundColor: "var(--bg-surface-glass)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--border-color)",
          borderRadius: "9999px",
          padding: "0.35rem 0.65rem",
          display: "flex",
          alignItems: "center",
          gap: "0.45rem",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.12)",
          cursor: "pointer",
          color: "inherit"
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {activeUsers.slice(0, 3).map((u, i) => (
            <div
              key={u.client_id}
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: u.color || "#3b82f6",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: "700",
                border: "2px solid var(--bg-surface)",
                marginLeft: i > 0 ? "-6px" : 0
              }}
              title={u.name}
            >
              {u.name?.charAt(0) || "U"}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>
          <Users size={14} />
          <span>{activeUsers.length}</span>
          {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </button>
    </div>
  );
}
