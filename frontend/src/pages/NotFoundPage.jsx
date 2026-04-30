/**
 * NotFoundPage.jsx — 404 fallback page (BUG-020 fix)
 */
import { Link } from "react-router-dom";
import { PageHeader } from "../components/ui";

export default function NotFoundPage() {
  return (
    <>
      <PageHeader
        title="404 — Page Not Found"
        description="The page you're looking for doesn't exist."
      />
      <div
        className="glass fade-up"
        style={{ padding: 48, textAlign: "center" }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h3
          className="display"
          style={{ margin: 0, fontSize: 18, color: "var(--text-primary)" }}
        >
          Lost in space
        </h3>
        <p style={{ margin: "10px 0 24px", color: "var(--text-muted)", fontSize: 13.5 }}>
          This route doesn't exist. Head back to the Dashboard.
        </p>
        <Link to="/" className="btn btn-cyan" style={{ marginTop: 0, textDecoration: "none" }}>
          ← Back to Dashboard
        </Link>
      </div>
    </>
  );
}
