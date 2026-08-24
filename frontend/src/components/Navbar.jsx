import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Layers, LogOut, Sun, Moon } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header style={{
      backgroundColor: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-color)",
      padding: "0.75rem 1.25rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      {/* Brand Logo */}
      <Link
        to="/dashboard"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          textDecoration: "none",
          color: "var(--text-primary)"
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
        <span style={{ fontWeight: "800", fontSize: "1.05rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          CollabEditor
        </span>
      </Link>

      {/* Actions: Theme Toggle & User Profile */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            padding: "0.4rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} />}
        </button>

        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.25rem 0.55rem",
              borderRadius: "9999px",
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-color)"
            }}>
              <div style={{
                width: "24px",
                height: "24px",
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
              <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "var(--text-primary)" }}>
                {user.full_name}
              </span>
            </div>

            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.4rem 0.65rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-secondary)",
                fontSize: "0.8125rem",
                fontWeight: "500",
                cursor: "pointer"
              }}
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
