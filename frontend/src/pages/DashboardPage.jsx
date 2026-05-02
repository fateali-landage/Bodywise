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
import StatCard from "../components/dashboard/StatCard";
import InsightCard from "../components/dashboard/InsightCard";
import HabitCard from "../components/dashboard/HabitCard";
import ChartSection from "../components/dashboard/ChartSection";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function TodaySummaryCard({ result, inputs }) {
  const calories = result.body ? Math.round(1800 + (parseFloat(inputs.activity || 3) * 120)) : 2100;
  const water = 6;
  const steps = 7842;
  const sleep = inputs.sleep || "—";

  const items = [
    { icon: "🔥", label: "Calories", value: `${calories}`, unit: "kcal", color: "#f97316" },
    { icon: "💧", label: "Water",    value: `${water}`,    unit: "glasses", color: "#0ea5e9" },
    { icon: "👟", label: "Steps",    value: steps.toLocaleString(), unit: "steps", color: "#00e5be" },
    { icon: "🌙", label: "Sleep",    value: `${sleep}`,   unit: "hrs", color: "#a78bfa" },
  ];

  return (
    <div className="glass" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 18 }}>📋</span>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
          Today's Summary
        </span>
        <span className="badge badge-amber" style={{ marginLeft: "auto", fontSize: 10 }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {items.map(({ icon, label, value, unit, color }) => (
          <div key={label} style={{
            padding: "14px 16px", borderRadius: "var(--radius-md)",
            background: `${color}0f`, border: `1px solid ${color}25`,
            display: "flex", flexDirection: "column", gap: 4,
          }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{unit}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, scores, result, inputs, habitItems, loading } = useBodyWise();

  const firstName = user?.email ? user.email.split("@")[0] : "friend";
  const bmi = result.body?.bmi ?? "—";
  const bmiStatus = result.body?.status ?? "Not analyzed";
  const lastUpdated = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <PageHeader
        eyebrow="Live Intelligence"
        title={
          <>
            {getGreeting()},{" "}
            <span style={{ background: "linear-gradient(135deg,#00e5be,#0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {firstName}
            </span>
          </>
        }
        description={
          <span>
            A high-level snapshot of your body, skin and lifestyle signals.{" "}
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
              Last updated {lastUpdated}
            </span>
          </span>
        }
      />

      {/* ── Top Stats Row ── */}
      <SectionTitle>Quick Stats</SectionTitle>
      <section className="fade-up d1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 32 }}>
        <StatCard icon="⚖️" label="BMI Index"    value={bmi}   sub={bmiStatus}               accent="#00e5be" trend={result.body ? 2 : undefined} />
        <StatCard icon="🔥" label="Calories"     value="2,100" sub="Goal: 2,400 kcal"         accent="#f97316" />
        <StatCard icon="💧" label="Water Intake" value="6"     sub="Goal: 8 glasses"          accent="#0ea5e9" trend={-5} />
        <StatCard icon="🌙" label="Sleep"        value={inputs.sleep || "7"} sub="hrs last night" accent="#a78bfa" trend={8} />
      </section>

      {/* ── Health Scores ── */}
      <SectionTitle>Health Scores</SectionTitle>
      <section className="fade-up d2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 32 }}>
        <ScoreRing value={scores.bodyScore}      label="Body Score"      icon="🫀" color="#00e5be" trackColor="rgba(0,229,190,0.10)"    glowColor="rgba(0,229,190,0.5)" />
        <ScoreRing value={scores.skinScore}      label="Skin Score"      icon="✨" color="#a78bfa" trackColor="rgba(167,139,250,0.10)"  glowColor="rgba(167,139,250,0.5)" />
        <ScoreRing value={scores.lifestyleScore} label="Lifestyle Score" icon="🌿" color="#34d399" trackColor="rgba(52,211,153,0.10)"   glowColor="rgba(52,211,153,0.5)" />
      </section>

      {/* ── AI Insight + Today Summary ── */}
      <SectionTitle>AI Insights</SectionTitle>
      <div className="fade-up d3" style={{ display: "grid", gridTemplateColumns: "1fr minmax(260px,340px)", gap: 14, marginBottom: 32 }}>
        <InsightCard insight={result.lifestyle?.insight} loading={loading.lifestyle} />
        <TodaySummaryCard result={result} inputs={inputs} />
      </div>

      {/* ── Charts ── */}
      <SectionTitle>Analytics</SectionTitle>
      <div className="fade-up d4" style={{ marginBottom: 32 }}>
        <ChartSection scores={scores} />
      </div>

      {/* ── Latest Insights + Habit Tracker ── */}
      <SectionTitle>Insights & Habits</SectionTitle>
      <div className="fade-up d5" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 32 }}>
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

        <HabitCard habitItems={habitItems} />
      </div>

      {/* ── CTA ── */}
      <div className="fade-up d6 glass" style={{ padding: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
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
