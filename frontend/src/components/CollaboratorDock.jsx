import React, { useState } from "react";
import { Users, ChevronUp, ChevronDown, UserPlus, Shield, Edit3, Eye, Sparkles } from "lucide-react";

export default function CollaboratorDock({
  activeUsers = [],
  allCollaborators = [],
  typingUsers = [],
  onOpenShare
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: 40,
      fontFamily: "inherit"
    }}>
      {/* Expanded Panel */}
      {isExpanded && (
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          width: "300px",
          padding: "1rem",
          marginBottom: "8px",
          animation: "fadeIn 0.2s ease"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0f172a" }}>
              Room Collaborators ({allCollaborators.length})
            </span>
            <button
              onClick={onOpenShare}
              style={{
                display: "flex", alignItems: "center", gap: "0.25rem",
                padding: "2px 8px", borderRadius: "6px", border: "1px solid #e2e8f0",
                backgroundColor: "#eff6ff", color: "#2563eb", fontSize: "0.75rem",
                fontWeight: "600", cursor: "pointer"
              }}
            >
              <UserPlus size={13} /> Invite
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto" }}>
            {allCollaborators.map((c) => {
              const isActive = activeUsers.some((u) => u.email === c.user.email);
              const activeUserObj = activeUsers.find((u) => u.email === c.user.email);
              const avatarColor = activeUserObj?.color || (c.role === "owner" ? "#2563eb" : "#16a34a");

              return (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.4rem 0.6rem",
                    borderRadius: "8px",
                    backgroundColor: isActive ? "#f8fafc" : "#fafafa",
                    border: "1px solid #f1f5f9"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{
                      position: "relative",
                      width: "28px", height: "28px", borderRadius: "50%",
                      backgroundColor: avatarColor, color: "#ffffff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.75rem", fontWeight: "700"
                    }}>
                      {c.user.full_name.charAt(0).toUpperCase()}
                      <span style={{
                        position: "absolute", bottom: "-1px", right: "-1px",
                        width: "8px", height: "8px", borderRadius: "50%",
                        backgroundColor: isActive ? "#22c55e" : "#94a3b8",
                        border: "1.5px solid #ffffff"
                      }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#0f172a" }}>
                        {c.user.full_name}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                        {isActive ? "Active now" : "Offline"}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: "0.7rem", padding: "1px 6px", borderRadius: "9999px",
                    fontWeight: "600", textTransform: "capitalize",
                    backgroundColor: c.role === "owner" ? "#dbeafe" : "#dcfce7",
                    color: c.role === "owner" ? "#1e40af" : "#166534"
                  }}>
                    {c.role}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Dock Pill */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          backdropFilter: "blur(12px)",
          borderRadius: "9999px",
          padding: "0.4rem 0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          cursor: "pointer",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          transition: "transform 0.15s ease"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
      >
        {/* Avatars Stack */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {activeUsers.map((u) => (
            <div
              key={u.client_id}
              style={{
                position: "relative",
                width: "26px", height: "26px", borderRadius: "50%",
                backgroundColor: u.color || "#2563eb", color: "#ffffff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.7rem", fontWeight: "700", border: "2px solid #0f172a",
                marginLeft: "-6px"
              }}
              title={`${u.name} (Active)`}
            >
              {u.name.charAt(0).toUpperCase()}
              <span style={{
                position: "absolute", bottom: "-1px", right: "-1px",
                width: "7px", height: "7px", borderRadius: "50%",
                backgroundColor: "#22c55e", border: "1.5px solid #0f172a"
              }} />
            </div>
          ))}
        </div>

        {/* Live Typing Status or User Count */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {typingUsers.length > 0 ? (
            <span style={{ color: "#38bdf8", fontSize: "0.75rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.2rem" }}>
              <Sparkles size={12} /> Typing...
            </span>
          ) : (
            <span style={{ color: "#f8fafc", fontSize: "0.75rem", fontWeight: "600" }}>
              {activeUsers.length} online
            </span>
          )}
        </div>

        <div style={{ color: "#94a3b8" }}>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </div>
    </div>
  );
}
