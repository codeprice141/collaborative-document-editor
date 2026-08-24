import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Layers, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header style={{
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid #e2e8f0",
      padding: "0.75rem 2rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      {/* Brand Logo & Name (No Underline!) */}
      <Link
        to="/dashboard"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          textDecoration: "none",
          color: "#0f172a"
        }}
      >
        <div style={{
          width: "34px",
          height: "34px",
          borderRadius: "10px",
          backgroundColor: "#2563eb",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 10px -2px rgba(37, 99, 235, 0.3)"
        }}>
          <Layers size={18} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: "800", fontSize: "1.05rem", letterSpacing: "-0.02em", color: "#0f172a" }}>
            CollabEditor
          </span>
        </div>
      </Link>

      {/* User Profile & Logout */}
      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.3rem 0.65rem",
            borderRadius: "9999px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "0.75rem"
            }}>
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#334155" }}>
              {user.full_name}
            </span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.4rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              color: "#64748b",
              fontSize: "0.8125rem",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.15s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#fee2e2";
              e.currentTarget.style.color = "#dc2626";
              e.currentTarget.style.borderColor = "#fca5a5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </header>
  );
}
