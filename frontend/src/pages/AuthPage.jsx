import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [focused, setFocused] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const action = isLogin
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });

    const { error } = await action;
    if (error) setMessage(error.message);
    else {
      setMessage(isLogin ? "Login successful." : "Signup successful. Check email if confirmation is enabled.");
      navigate("/");
    }
    setLoading(false);
  };

  const t = isDark ? themes.dark : themes.light;

  return (
    <>
      <style>{css(isDark)}</style>
      <div className={`auth-root ${isDark ? "dark" : "light"} ${mounted ? "mounted" : ""}`} style={{ background: t.pageBg }}>

        {/* Ambient background blobs */}
        <div className="blob blob-1" style={{ background: t.blob1 }} />
        <div className="blob blob-2" style={{ background: t.blob2 }} />
        <div className="noise-overlay" />

        {/* Theme toggle */}
        <button
          className="theme-toggle"
          onClick={() => setIsDark(p => !p)}
          style={{ background: t.toggleBg, color: t.toggleIcon, borderColor: t.border }}
          aria-label="Toggle theme"
        >
          {isDark ? "☀" : "☽"}
        </button>

        {/* Card */}
        <div
          className="auth-card"
          style={{
            background: t.cardBg,
            borderColor: t.border,
            boxShadow: t.cardShadow,
          }}
        >
          {/* Logo mark */}
          <div className="logo-wrap">
            <div className="logo-icon" style={{ background: t.logoBg }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2C6.03 2 2 6.03 2 11s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 4a3 3 0 110 6 3 3 0 010-6zm0 12a7 7 0 01-5.19-2.31A6.99 6.99 0 0111 14c1.93 0 3.68.79 4.95 2.06A6.97 6.97 0 0111 18z" fill="white"/>
              </svg>
            </div>
            <div>
              <h1 className="brand-name" style={{ color: t.brandName }}>BodyWise AI</h1>
              <p className="brand-sub" style={{ color: t.subText }}>Personal Body & Skin Intelligence</p>
            </div>
          </div>

          {/* Tab toggle */}
          <div className="tab-row" style={{ background: t.tabRowBg, borderColor: t.border }}>
            {["Sign In", "Sign Up"].map((label, i) => {
              const active = isLogin === (i === 0);
              return (
                <button
                  key={label}
                  className={`tab-btn ${active ? "tab-active" : ""}`}
                  style={active
                    ? { background: t.tabActiveBg, color: t.tabActiveText, boxShadow: t.tabActiveShadow }
                    : { color: t.tabInactiveText }}
                  onClick={() => { setIsLogin(i === 0); setMessage(""); }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Heading */}
          <div className="form-heading">
            <h2 style={{ color: t.headingText }}>
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p style={{ color: t.subText }}>
              {isLogin
                ? "Sign in to your BodyWise account"
                : "Start your personalised health journey"}
            </p>
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit}>

            {/* Email */}
            <div className={`field-group ${focused === "email" ? "field-focused" : ""}`}>
              <label style={{ color: t.label }}>Email address</label>
              <div className="input-wrap" style={{
                borderColor: focused === "email" ? t.focusBorder : t.inputBorder,
                background: t.inputBg,
                boxShadow: focused === "email" ? t.focusShadow : "none",
              }}>
                <span className="input-icon" style={{ color: t.iconColor }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  style={{ color: t.inputText, caretColor: t.focusBorder }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className={`field-group ${focused === "password" ? "field-focused" : ""}`}>
              <label style={{ color: t.label }}>Password</label>
              <div className="input-wrap" style={{
                borderColor: focused === "password" ? t.focusBorder : t.inputBorder,
                background: t.inputBg,
                boxShadow: focused === "password" ? t.focusShadow : "none",
              }}>
                <span className="input-icon" style={{ color: t.iconColor }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </span>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  style={{ color: t.inputText, caretColor: t.focusBorder }}
                  required
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              <span className="btn-gradient" />
              <span className="btn-label">
                {loading ? (
                  <span className="spinner-wrap">
                    <span className="spinner" />
                    Please wait…
                  </span>
                ) : (
                  isLogin ? "Sign In" : "Create Account"
                )}
              </span>
            </button>

          </form>

          {/* Feedback message */}
          {message && (
            <div
              className="feedback-msg"
              style={{
                background: message.toLowerCase().includes("error") || message.toLowerCase().includes("invalid")
                  ? t.errorBg : t.successBg,
                color: message.toLowerCase().includes("error") || message.toLowerCase().includes("invalid")
                  ? t.errorText : t.successText,
                borderColor: message.toLowerCase().includes("error") || message.toLowerCase().includes("invalid")
                  ? t.errorBorder : t.successBorder,
              }}
            >
              {message}
            </div>
          )}

          {/* Footer switch */}
          <p className="switch-text" style={{ color: t.subText }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              className="switch-btn"
              style={{ color: t.accentText }}
              onClick={() => { setIsLogin(p => !p); setMessage(""); }}
            >
              {isLogin ? "Sign up free" : "Sign in"}
            </button>
          </p>

        </div>
      </div>
    </>
  );
}

/* ─── Themes ─────────────────────────────────────────────────────────────── */
const themes = {
  dark: {
    pageBg: "linear-gradient(135deg, #020818 0%, #050d24 50%, #030a1a 100%)",
    blob1: "radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 70%)",
    blob2: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
    toggleBg: "rgba(255,255,255,0.06)",
    toggleIcon: "#94a3b8",
    border: "rgba(255,255,255,0.08)",
    cardBg: "rgba(10,20,45,0.75)",
    cardShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)",
    logoBg: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
    brandName: "#e2e8f0",
    subText: "#64748b",
    tabRowBg: "rgba(255,255,255,0.04)",
    tabActiveBg: "rgba(14,165,233,0.15)",
    tabActiveText: "#38bdf8",
    tabActiveShadow: "inset 0 0 0 1px rgba(56,189,248,0.3)",
    tabInactiveText: "#475569",
    headingText: "#f1f5f9",
    label: "#94a3b8",
    inputBg: "rgba(255,255,255,0.04)",
    inputBorder: "rgba(255,255,255,0.1)",
    inputText: "#e2e8f0",
    iconColor: "#475569",
    focusBorder: "#0ea5e9",
    focusShadow: "0 0 0 3px rgba(14,165,233,0.15)",
    accentText: "#38bdf8",
    errorBg: "rgba(239,68,68,0.1)",
    errorText: "#fca5a5",
    errorBorder: "rgba(239,68,68,0.3)",
    successBg: "rgba(34,197,94,0.1)",
    successText: "#86efac",
    successBorder: "rgba(34,197,94,0.3)",
  },
  light: {
    pageBg: "linear-gradient(135deg, #f0f4f8 0%, #e8eef5 50%, #f0f4f8 100%)",
    blob1: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)",
    blob2: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)",
    toggleBg: "rgba(255,255,255,0.9)",
    toggleIcon: "#64748b",
    border: "rgba(0,0,0,0.08)",
    cardBg: "rgba(255,255,255,0.85)",
    cardShadow: "0 24px 64px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
    logoBg: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
    brandName: "#0f172a",
    subText: "#94a3b8",
    tabRowBg: "rgba(0,0,0,0.04)",
    tabActiveBg: "rgba(14,165,233,0.1)",
    tabActiveText: "#0284c7",
    tabActiveShadow: "inset 0 0 0 1px rgba(2,132,199,0.25)",
    tabInactiveText: "#94a3b8",
    headingText: "#0f172a",
    label: "#475569",
    inputBg: "#ffffff",
    inputBorder: "#e2e8f0",
    inputText: "#0f172a",
    iconColor: "#94a3b8",
    focusBorder: "#0ea5e9",
    focusShadow: "0 0 0 3px rgba(14,165,233,0.15)",
    accentText: "#0284c7",
    errorBg: "rgba(239,68,68,0.06)",
    errorText: "#dc2626",
    errorBorder: "rgba(239,68,68,0.2)",
    successBg: "rgba(34,197,94,0.06)",
    successText: "#16a34a",
    successBorder: "rgba(34,197,94,0.2)",
  },
};

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const css = (isDark) => `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .auth-root {
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }

  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }
  .blob-1 { width: 600px; height: 600px; top: -150px; left: -150px; }
  .blob-2 { width: 500px; height: 500px; bottom: -100px; right: -100px; }

  .noise-overlay {
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none; opacity: 0.4;
  }

  .theme-toggle {
    position: fixed; top: 20px; right: 20px;
    width: 40px; height: 40px;
    border-radius: 12px;
    border: 1px solid;
    cursor: pointer;
    font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s, opacity 0.2s;
    backdrop-filter: blur(12px);
    z-index: 100;
  }
  .theme-toggle:hover { transform: scale(1.1); }

  .auth-card {
    position: relative; z-index: 1;
    width: 100%; max-width: 440px;
    border-radius: 24px;
    border: 1px solid;
    padding: 40px;
    backdrop-filter: blur(20px);
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  .mounted .auth-card { opacity: 1; transform: translateY(0); }

  .logo-wrap {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 28px;
  }
  .logo-icon {
    width: 44px; height: 44px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .brand-name {
    font-family: 'Syne', sans-serif;
    font-size: 18px; font-weight: 700;
    letter-spacing: -0.3px;
    line-height: 1.2;
  }
  .brand-sub {
    font-size: 12px;
    margin-top: 2px;
  }

  .tab-row {
    display: flex;
    border-radius: 12px;
    border: 1px solid;
    padding: 4px;
    margin-bottom: 28px;
  }
  .tab-btn {
    flex: 1;
    padding: 9px;
    border: none;
    border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500;
    cursor: pointer;
    background: transparent;
    transition: all 0.22s ease;
  }
  .tab-active { transition: all 0.22s ease; }

  .form-heading { margin-bottom: 24px; }
  .form-heading h2 {
    font-family: 'Syne', sans-serif;
    font-size: 22px; font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }
  .form-heading p { font-size: 14px; }

  .auth-form { display: flex; flex-direction: column; gap: 18px; }

  .field-group label {
    display: block;
    font-size: 13px; font-weight: 500;
    margin-bottom: 7px;
    letter-spacing: 0.01em;
  }

  .input-wrap {
    display: flex; align-items: center;
    border: 1.5px solid;
    border-radius: 12px;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-icon {
    padding: 0 12px 0 14px;
    display: flex; align-items: center;
    flex-shrink: 0;
  }
  .input-wrap input {
    flex: 1;
    padding: 13px 14px 13px 0;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    border: none; outline: none;
    background: transparent;
  }
  .input-wrap input::placeholder { color: #64748b; }

  .submit-btn {
    position: relative;
    padding: 14px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 600;
    color: white;
    overflow: hidden;
    margin-top: 4px;
    transition: transform 0.18s, opacity 0.18s;
  }
  .submit-btn:hover:not(:disabled) { transform: translateY(-1px); }
  .submit-btn:active:not(:disabled) { transform: translateY(0px); }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .btn-gradient {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #06b6d4 100%);
    transition: opacity 0.2s;
  }
  .submit-btn:hover:not(:disabled) .btn-gradient {
    background: linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%);
  }
  .btn-label { position: relative; z-index: 1; }

  .spinner-wrap { display: flex; align-items: center; justify-content: center; gap: 8px; }
  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .feedback-msg {
    margin-top: 16px;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid;
    font-size: 13px;
    line-height: 1.5;
  }

  .switch-text {
    margin-top: 20px;
    text-align: center;
    font-size: 14px;
  }
  .switch-btn {
    background: none; border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-color: transparent;
    transition: text-decoration-color 0.2s;
  }
  .switch-btn:hover { text-decoration-color: currentColor; }

  @media (max-width: 480px) {
    .auth-card { padding: 28px 24px; }
  }
`;
