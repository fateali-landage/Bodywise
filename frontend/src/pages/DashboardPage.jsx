import { Link } from "react-router-dom";
import { useBodyWise } from "../context/BodyWiseContext";
import {
  EmptyState,
  PageHeader,
  ResultBox,
  ScoreRing,
  SectionHeader,
  SectionTitle,
} from "../components/ui";

export default function DashboardPage() {
  const { user, scores, result } = useBodyWise();

  const firstName = user?.email ? user.email.split("@")[0] : "friend";

  return (
    <>
      <PageHeader
        eyebrow="Live Intelligence"
        title={
          <>
            Welcome back,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #00e5be, #0ea5e9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {firstName}
            </span>
          </>
        }
        description="A high-level snapshot of your body, skin and lifestyle signals."
      />

      <SectionTitle>Health Scores</SectionTitle>
      <section
        className="fade-up d1"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 40,
        }}
      >
        <ScoreRing
          value={scores.bodyScore}
          label="Body Score"
          icon="🫀"
          color="#00e5be"
          trackColor="rgba(0,229,190,0.10)"
          glowColor="rgba(0,229,190,0.5)"
        />
        <ScoreRing
          value={scores.skinScore}
          label="Skin Score"
          icon="✨"
          color="#a78bfa"
          trackColor="rgba(167,139,250,0.10)"
          glowColor="rgba(167,139,250,0.5)"
        />
        <ScoreRing
          value={scores.lifestyleScore}
          label="Lifestyle Score"
          icon="🌿"
          color="#34d399"
          trackColor="rgba(52,211,153,0.10)"
          glowColor="rgba(52,211,153,0.5)"
        />
      </section>

      <SectionTitle>Latest Insights</SectionTitle>
      <div
        className="fade-up d2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
          marginBottom: 40,
        }}
      >
        <div className="glass" style={{ padding: 24 }}>
          <SectionHeader icon="🫀" title="Body" badge="Snapshot" badgeColor="cyan" />
          {result.body ? (
            <ResultBox>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                <span className="badge badge-cyan mono">BMI {result.body.bmi}</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{result.body.status}</span>
              </div>
              <p style={{ margin: 0, color: "var(--text-secondary)" }}>{result.body.insight}</p>
            </ResultBox>
          ) : (
            <EmptyState message="Run an analysis to populate body insights" />
          )}
        </div>

        <div className="glass" style={{ padding: 24 }}>
          <SectionHeader icon="✨" title="Skin" badge="Vision AI" badgeColor="violet" />
          {result.skin ? (
            <ResultBox>
              <div style={{ marginBottom: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {result.skin.detected.map((d) => (
                  <span key={d} className="badge badge-violet">{d}</span>
                ))}
              </div>
              <p style={{ margin: 0, color: "var(--text-secondary)" }}>{result.skin.insight}</p>
            </ResultBox>
          ) : (
            <EmptyState message="Skin insights will appear after analysis" />
          )}
        </div>

        <div className="glass" style={{ padding: 24 }}>
          <SectionHeader icon="🌿" title="Lifestyle" badge="Holistic" badgeColor="amber" />
          {result.lifestyle ? (
            <ResultBox>{result.lifestyle.insight}</ResultBox>
          ) : (
            <EmptyState message="Configure lifestyle factors on the Analyze page" />
          )}
        </div>
      </div>

      <div
        className="fade-up d3 glass"
        style={{
          padding: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div className="section-label" style={{ marginBottom: 6 }}>Get started</div>
          <h3 className="display" style={{ margin: 0, fontSize: 18, color: "var(--text-primary)" }}>
            Run a fresh body, skin and lifestyle analysis
          </h3>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--text-muted)" }}>
            Takes under a minute — your results sync to the Results page automatically.
          </p>
        </div>
        <Link to="/analyze" className="btn btn-cyan" style={{ marginTop: 0, textDecoration: "none" }}>
          Start Analysis →
        </Link>
      </div>
    </>
  );
}
