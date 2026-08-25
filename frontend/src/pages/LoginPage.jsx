import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../services/api";
import { FileText, LogIn, Sun, Moon, AlertCircle, Info } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState("");
  const googleBtnRef = useRef(null);

  const { login, loginWithGoogle } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Load OAuth Config & Initialize Google Identity Services (GSI)
  useEffect(() => {
    api.getOAuthConfig().then((cfg) => {
      if (cfg?.google_client_id) {
        setGoogleClientId(cfg.google_client_id);
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: cfg.google_client_id,
            callback: handleGoogleCallback,
          });
          if (googleBtnRef.current) {
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: isDark ? "filled_black" : "outline",
              size: "large",
              width: 320,
              text: "continue_with",
              shape: "pill",
            });
          }
        }
      }
    }).catch(() => {});
  }, [isDark]);

  const handleGoogleCallback = async (response) => {
    if (response?.credential) {
      setLoading(true);
      setError("");
      try {
        await loginWithGoogle(response.credential);
        navigate("/dashboard");
      } catch (err) {
        setError(err.message || "Google authentication failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleClick = () => {
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      // Direct Google OAuth 2.0 Authorization Endpoint
      const clientId = googleClientId || "407408718192.apps.googleusercontent.com"; // Standard demo GSuite client
      const redirectUri = window.location.origin;
      const scope = encodeURIComponent("openid email profile");
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token%20id_token&scope=${scope}&nonce=nonce_${Date.now()}`;
      
      // Open official Google Accounts chooser in popup window
      const popup = window.open(googleAuthUrl, "google_oauth_popup", "width=500,height=600,menubar=no,toolbar=no");
      if (!popup) {
        setError("Popup blocked. Please allow popups for Google sign-in.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
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

      <div style={{ backgroundColor: "var(--bg-surface)", padding: "2.5rem 2rem", borderRadius: "18px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", width: "100%", maxWidth: "420px", border: "1px solid var(--border-color)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{ display: "inline-flex", padding: "0.75rem", borderRadius: "14px", backgroundColor: "#eff6ff", color: "#2563eb", marginBottom: "0.75rem" }}>
            <FileText size={30} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Welcome Back</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Sign in to your CollabEditor account</p>
        </div>

        {error && (
          <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "0.75rem", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "1.25rem", border: "1px solid #fee2e2", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Real Google OAuth 2.0 Button */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div ref={googleBtnRef} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.7rem",
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
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
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", margin: "1.25rem 0", gap: "0.5rem" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>or email</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", fontSize: "0.9rem", outline: "none" }}
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
              style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", fontSize: "0.9rem", outline: "none" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "0.5rem",
              padding: "0.75rem",
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
              gap: "0.5rem",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)"
            }}
          >
            <LogIn size={17} />
            <span>{loading ? "Signing in..." : "Sign In"}</span>
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#2563eb", fontWeight: "600" }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
