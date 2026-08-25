import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ConfirmModal from "./ConfirmModal";
import { Layers, LogOut, Sun, Moon, Sparkles } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header style={{
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-color)",
        padding: "0.75rem 1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "var(--shadow-sm)"
      }}>
        {/* Brand Logo & SaaS Name */}
        <Link
          to="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            textDecoration: "none",
            color: "var(--text-primary)"
          }}
        >
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px -2px rgba(59, 130, 246, 0.35)"
          }}>
            <Layers size={19} />
          </div>
          <div>
            <div style={{ fontWeight: "800", fontSize: "1.15rem", letterSpacing: "-0.03em", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span>AetherDoc</span>
              <span style={{ fontSize: "0.65rem", padding: "1px 5px", borderRadius: "4px", backgroundColor: "var(--accent-glow)", color: "var(--accent-color)", fontWeight: "700" }}>PRO</span>
            </div>
          </div>
        </Link>

        {/* Actions: Theme Toggle & User Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              padding: "0.45rem",
              borderRadius: "9px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease"
            }}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} />}
          </button>

          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.3rem 0.65rem",
                borderRadius: "9999px",
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-color)"
              }}>
                <div style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent-color)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "0.75rem"
                }}>
                  {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "var(--text-primary)" }}>
                  {user.full_name}
                </span>
              </div>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.45rem 0.75rem",
                  borderRadius: "9px",
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
                <span className="hidden-mobile">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Sign Out of AetherDoc?"
        message="Are you sure you want to sign out? Your document edits and real-time state are safely persisted."
        confirmText="Sign Out"
        type="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
