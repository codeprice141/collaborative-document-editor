import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FileText, LogIn, Sun, Moon, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail, demoName) => {
    setError("");
    setLoading(true);
    try {
      try {
        await login(demoEmail, "password123");
      } catch {
        await register(demoEmail, "password123", demoName);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to demo login");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    // In production OAuth flow, redirect to backend OAuth endpoint /api/v1/auth/oauth/{provider}
    // For seamless local testing, auto-login with verified OAuth provider persona
    handleQuickDemo(`${provider.toLowerCase()}_user@example.com`, `${provider} User`);
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
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-primary)" }}>Welcome Back</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Sign in to collaborate in real-time</p>
        </div>

        {error && (
          <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "0.75rem", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "1rem", border: "1px solid #fee2e2" }}>
            {error}
          </div>
        )}

        {/* OAuth Social Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <button
            type="button"
            onClick={() => handleOAuthLogin("Google")}
            style={{
              width: "100%", padding: "0.65rem", borderRadius: "10px",
              border: "1px solid var(--border-color)", backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)", fontSize: "0.875rem", fontWeight: "600",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin("GitHub")}
            style={{
              width: "100%", padding: "0.65rem", borderRadius: "10px",
              border: "1px solid var(--border-color)", backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)", fontSize: "0.875rem", fontWeight: "600",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            <span>Continue with GitHub</span>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", margin: "1rem 0", gap: "0.5rem" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>or email</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
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
            <LogIn size={17} />
            <span>{loading ? "Signing in..." : "Sign In"}</span>
          </button>
        </form>

        {/* 1-Click Fast Demo Logins */}
        <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "0.5rem", textAlign: "center", textTransform: "uppercase" }}>
            ⚡ 1-Click Demo Accounts
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => handleQuickDemo("alice@demo.com", "Alice")}
              style={{
                flex: 1, padding: "0.45rem", borderRadius: "8px", border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.75rem",
                fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem"
              }}
            >
              <Sparkles size={13} color="#2563eb" />
              <span>Alice</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("bob@demo.com", "Bob")}
              style={{
                flex: 1, padding: "0.45rem", borderRadius: "8px", border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.75rem",
                fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem"
              }}
            >
              <Sparkles size={13} color="#16a34a" />
              <span>Bob</span>
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#2563eb", fontWeight: "600" }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
