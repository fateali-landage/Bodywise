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

export default function ResultsPage() {
  const { result, scores } = useBodyWise();
  const hasAny = result.body || result.skin || result.lifestyle || result.food;

  return (
    <>
      <PageHeader
        title="Results"
        description="A consolidated view of every analysis you've run in this session."
        actions={
          <Link to="/analyze" className="btn btn-cyan" style={{ marginTop: 0, textDecoration: "none" }}>
            Run new analysis
          </Link>
        }
      />

      {!hasAny ? (
        <div className="fade-up glass" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <h3 className="display" style={{ margin: 0, fontSize: 18, color: "var(--text-primary)" }}>
            No results yet
          </h3>
          <p style={{ margin: "8px 0 20px", color: "var(--text-muted)", fontSize: 13.5 }}>
            Head over to the Analyze page to generate your first report.
          </p>
          <Link to="/analyze" className="btn btn-cyan" style={{ marginTop: 0, textDecoration: "none" }}>
            Go to Analyze →
          </Link>
        </div>
      ) : (
        <>
          <SectionTitle>Score Summary</SectionTitle>
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

          <SectionTitle>Body & Skin</SectionTitle>
          <div
            className="fade-up d2"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 14,
              marginBottom: 40,
            }}
          >
            <div className="glass" style={{ padding: 24 }}>
              <SectionHeader icon="🫀" title="Body Report" badge="BMI" badgeColor="cyan" />
              {result.body ? (
                <ResultBox>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    <span className="badge badge-cyan mono">BMI {result.body.bmi}</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{result.body.status}</span>
                  </div>
                  <p style={{ margin: "0 0 10px", color: "var(--text-secondary)" }}>{result.body.insight}</p>
                  <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "var(--text-muted)", fontSize: 12.5 }}>
                    {result.body.recommendations?.map((r) => (
                      <li key={r} style={{ marginBottom: 4 }}>{r}</li>
                    ))}
                  </ul>
                  {result.prediction && (
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 12.5, color: "var(--text-muted)" }}>
                      <span>📈 {result.prediction.weightTrend}</span>
                      <span style={{ margin: "0 8px" }}>·</span>
                      <span>Skin risk: {result.prediction.skinConditionRisk}</span>
                    </div>
                  )}
                </ResultBox>
              ) : (
                <EmptyState message="No body analysis yet" />
              )}
            </div>

            <div className="glass" style={{ padding: 24 }}>
              <SectionHeader icon="✨" title="Skin Report" badge="Vision AI" badgeColor="violet" />
              {result.skin ? (
                <ResultBox>
                  <div style={{ marginBottom: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {result.skin.detected.map((d) => (
                      <span key={d} className="badge badge-violet">
                        {d}
                      </span>
                    ))}
                  </div>
                  <p style={{ margin: "0 0 10px", color: "var(--text-secondary)" }}>{result.skin.insight}</p>
                  <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "var(--text-muted)", fontSize: 12.5 }}>
                    {result.skin.suggestions?.map((s) => (
                      <li key={s} style={{ marginBottom: 4 }}>{s}</li>
                    ))}
                  </ul>
                </ResultBox>
              ) : (
                <EmptyState message="No skin analysis yet" />
              )}
            </div>
          </div>

          <SectionTitle>Lifestyle & Nutrition</SectionTitle>
          <div
            className="fade-up d3"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 14,
              marginBottom: 40,
            }}
          >
            <div className="glass" style={{ padding: 24 }}>
              <SectionHeader icon="🌿" title="Lifestyle Report" badge="Holistic" badgeColor="amber" />
              {result.lifestyle ? (
                <ResultBox>
                  <div style={{ marginBottom: 8 }}>
                    <span className="badge badge-amber mono">Score {result.lifestyle.lifestyleScore}</span>
                  </div>
                  <p style={{ margin: "0 0 10px", color: "var(--text-secondary)" }}>{result.lifestyle.insight}</p>
                  <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "var(--text-muted)", fontSize: 12.5 }}>
                    {result.lifestyle.explanations?.map((e) => (
                      <li key={e} style={{ marginBottom: 4 }}>{e}</li>
                    ))}
                  </ul>
                </ResultBox>
              ) : (
                <EmptyState message="No lifestyle analysis yet" />
              )}
            </div>

            <div className="glass" style={{ padding: 24 }}>
              <SectionHeader icon="🥗" title="Latest Meal" badge="Food AI" badgeColor="violet" />
              {result.food ? (
                <ResultBox>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, color: "var(--violet)" }}>{result.food.food}</span>
                    <span className="badge badge-cyan mono">{result.food.estimatedCalories} kcal</span>
                  </div>
                  <p style={{ margin: 0, color: "var(--text-secondary)" }}>{result.food.insight}</p>
                </ResultBox>
              ) : (
                <EmptyState message="No meal logged yet — try the Diet & Calories page" />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
