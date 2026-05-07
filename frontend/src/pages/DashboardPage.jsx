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
    <div className="glass p-4 sm:p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">📋</span>
        <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">
          Today's Summary
        </span>
        <span className="badge badge-amber ml-auto text-[10px]">
          {new Date().toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1">
        {items.map(({ icon, label, value, unit, color }) => (
          <div key={label} className="p-3.5 sm:p-4 rounded-[var(--radius-md)] flex flex-col gap-1 justify-center" style={{
            background: `${color}0f`, border: `1px solid ${color}25`
          }}>
            <span className="text-lg">{icon}</span>
            <div className="font-syne font-extrabold text-xl leading-none" style={{ color }}>{value}</div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{unit}</div>
            <div className="text-[11px] text-[var(--text-secondary)]">{label}</div>
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
      <section className="fade-up d1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon="⚖️" 
          label="BMI Index"    
          value={bmi}   
          sub={bmiStatus}               
          accent="#00e5be" 
          trend={result.body ? 2 : undefined} 
        />
        <StatCard 
          icon="🔥" 
          label="Calories"     
          value={result.body ? Math.round(1800 + (parseFloat(inputs.activity || 3) * 120)).toLocaleString() : "2,100"} 
          sub={result.body ? "Calculated BMR" : "Goal: 2,400 kcal"}         
          accent="#f97316" 
        />
        <StatCard 
          icon="💧" 
          label="Water Intake" 
          value={habitItems?.water ? "8" : "6"}     
          sub="Goal: 8 glasses"          
          accent="#0ea5e9" 
          trend={habitItems?.water ? 5 : -5} 
        />
        <StatCard 
          icon="🌙" 
          label="Sleep"        
          value={inputs.sleep || "7"} 
          sub="hrs last night" 
          accent="#a78bfa" 
          trend={parseFloat(inputs.sleep) >= 7 ? 8 : -10} 
        />
      </section>

      {/* ── Health Scores ── */}
      <SectionTitle>Health Scores</SectionTitle>
      <section className="fade-up d2 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <ScoreRing value={scores.bodyScore}      label="Body Score"      icon="🫀" color="#00e5be" trackColor="rgba(0,229,190,0.10)"    glowColor="rgba(0,229,190,0.5)" />
        <ScoreRing value={scores.skinScore}      label="Skin Score"      icon="✨" color="#a78bfa" trackColor="rgba(167,139,250,0.10)"  glowColor="rgba(167,139,250,0.5)" />
        <ScoreRing value={scores.lifestyleScore} label="Lifestyle Score" icon="🌿" color="#34d399" trackColor="rgba(52,211,153,0.10)"   glowColor="rgba(52,211,153,0.5)" />
      </section>

      {/* ── AI Insight + Today Summary ── */}
      <SectionTitle>AI Insights</SectionTitle>
      <div className="fade-up d3 grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,340px)] gap-4 mb-8 items-stretch">
        <InsightCard insight={result.lifestyle?.insight} loading={loading.lifestyle} />
        <TodaySummaryCard result={result} inputs={inputs} />
      </div>

      {/* ── Charts ── */}
      <SectionTitle>Analytics</SectionTitle>
      <div className="fade-up d4 mb-8">
        <ChartSection scores={scores} />
      </div>

      {/* ── Latest Insights + Habit Tracker ── */}
      <SectionTitle>Insights & Habits</SectionTitle>
      <div className="fade-up d5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="glass p-4 sm:p-6 h-full flex flex-col">
          <SectionHeader icon="🫀" title="Body" badge="Snapshot" badgeColor="cyan" />
          <div className="flex-1 mt-4">
            {result.body ? (
              <ResultBox>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="badge badge-cyan mono">BMI {result.body.bmi}</span>
                  <span className="font-medium text-[var(--text-primary)]">{result.body.status}</span>
                </div>
                <p className="m-0 text-[var(--text-secondary)]">{result.body.insight}</p>
              </ResultBox>
            ) : (
              <EmptyState message="Run an analysis to populate body insights" />
            )}
          </div>
        </div>

        <div className="glass p-4 sm:p-6 h-full flex flex-col">
          <SectionHeader icon="✨" title="Skin" badge="Vision AI" badgeColor="violet" />
          <div className="flex-1 mt-4">
            {result.skin ? (
              <ResultBox>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {result.skin.detected.map((d) => (
                    <span key={d} className="badge badge-violet">{d}</span>
                  ))}
                </div>
                <p className="m-0 text-[var(--text-secondary)]">{result.skin.insight}</p>
              </ResultBox>
            ) : (
              <EmptyState message="Skin insights will appear after analysis" />
            )}
          </div>
        </div>

        <HabitCard habitItems={habitItems} />
      </div>

      {/* ── CTA ── */}
      <div className="fade-up d6 glass p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="section-label mb-1.5">Get started</div>
          <h3 className="display m-0 text-lg sm:text-xl text-[var(--text-primary)]">
            Run a fresh body, skin and lifestyle analysis
          </h3>
          <p className="mt-1.5 mb-0 text-[13.5px] sm:text-sm text-[var(--text-muted)]">
            Takes under a minute — your results sync to the Results page automatically.
          </p>
        </div>
        <Link to="/analyze" className="btn btn-cyan w-full md:w-auto mt-0 whitespace-nowrap text-center justify-center">
          Start Analysis →
        </Link>
      </div>
    </>
  );
}
