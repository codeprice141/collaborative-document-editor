import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FileText, UserPlus, Sun, Moon } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(email, password, fullName);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)", padding: "1rem", position: "relative" }}>
      {/* Theme Toggle Top-Right */}
      <button
        onClick={toggleTheme}
        style={{
          position: "absolute", top: "16px", right: "16px",
          padding: "0.45rem", borderRadius: "10px",
          border: "1px solid var(--border-color)", backgroundColor: "var(--bg-surface)",
          color: "var(--text-secondary)", cursor: "pointer"
        }}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDark ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} />}
      </button>

      <div style={{ backgroundColor: "var(--bg-surface)", padding: "2.25rem", borderRadius: "18px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", width: "100%", maxWidth: "420px", border: "1px solid var(--border-color)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{ display: "inline-flex", padding: "0.75rem", borderRadius: "14px", backgroundColor: "#eff6ff", color: "#2563eb", marginBottom: "0.75rem" }}>
            <FileText size={30} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-primary)" }}>Create Account</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Start editing and collaborating with your team</p>
        </div>

        {error && (
          <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "0.75rem", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "1rem", border: "1px solid #fee2e2" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Alice Johnson"
              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", fontSize: "0.9rem", outline: "none" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="alice@example.com"
              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", fontSize: "0.9rem", outline: "none" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", fontSize: "0.9rem", outline: "none" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "0.4rem",
              padding: "0.7rem",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem"
            }}
          >
            <UserPlus size={17} />
            <span>{loading ? "Creating account..." : "Sign Up"}</span>
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#2563eb", fontWeight: "600" }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
