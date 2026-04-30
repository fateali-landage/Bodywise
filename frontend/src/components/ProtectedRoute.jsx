/**
 * ProtectedRoute.jsx
 * Guards all authenticated routes.
 *
 * BUG-015 FIX: replaced unstyled "Loading session..." text with a
 * branded spinner that uses the design-system CSS variables.
 */
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ user, loading, children }) {
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 16,
          background: "var(--bg-base)",
        }}
      >
        {/* Inline spinner — no external dependency needed */}
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          style={{ animation: "spin 0.8s linear infinite" }}
        >
          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="var(--cyan)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          Loading session…
        </span>

        {/* Reuse the spin keyframe already defined in design-system.css */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  return children;
}
