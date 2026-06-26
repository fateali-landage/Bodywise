import { Link } from "react-router-dom";
import { useBodyWise } from "../context/BodyWiseContext";
import {
  EmptyState,
  PageHeader,
  ResultBox,
  ScoreRing,
  SectionHeader,
  SectionTitle,
  CardSkeleton,
  ChartSkeleton,
  ScoreSkeleton,
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
    <div className="glass p-5 sm:p-6 h-full flex flex-col justify-between hover:border-[var(--border-hover)]">
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
          <div key={label} className="p-3.5 rounded-xl flex flex-col justify-between transition-all duration-200" style={{
            background: `${color}0b`, border: `1px solid ${color}1a`
          }}>
            <div className="flex justify-between items-center">
              <span className="text-base">{icon}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono">{unit}</span>
            </div>
            <div className="mt-3">
              <div className="font-syne font-extrabold text-lg leading-none" style={{ color }}>{value}</div>
              <div className="text-[12px] text-[var(--text-secondary)] font-medium mt-1">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, scores, result, inputs, habitItems, loading } = useBodyWise();

  const emailName = user?.email ? user.email.split("@")[0] : "friend";
  // Capitalize name
  const firstName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
  
  const bmi = result.body?.bmi ?? "—";
  const bmiStatus = result.body?.status ?? "Not analyzed";
  const lastUpdated = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const hasAnyData = result.body || result.skin || result.lifestyle;
  const isGlobalLoading = loading.body || loading.lifestyle;

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Intelligence Dashboard"
        title={
          <>
            {getGreeting()},{" "}
            <span style={{ background: "linear-gradient(135deg, var(--cyan), var(--violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800 }}>
              {firstName}
            </span>
          </>
        }
        description={
          <span>
            A high-level snapshot of your body, skin and lifestyle signals.{" "}
            <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 6 }}>
              Sync active (Last updated {lastUpdated})
            </span>
          </span>
        }
      />

      {isGlobalLoading ? (
        <>
          <SectionTitle>Loading Dashboard...</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <ScoreSkeleton />
            <ScoreSkeleton />
            <ScoreSkeleton />
          </div>
          <ChartSkeleton />
        </>
      ) : (
        <>
          {/* ── Top Stats Row ── */}
          <SectionTitle>Quick Stats</SectionTitle>
          <section className="fade-up d1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              icon="⚖️" 
              label="BMI Index"    
              value={bmi}   
              sub={bmiStatus}               
              accent="var(--cyan)" 
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
              accent="var(--violet)" 
              trend={parseFloat(inputs.sleep) >= 7 ? 8 : -10} 
            />
          </section>

          {/* ── Health Scores & Streaks ── */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5 mt-4">
            <div className="flex flex-col gap-3">
              <SectionTitle>Health Scores</SectionTitle>
              <section className="fade-up d2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ScoreRing value={scores.bodyScore}      label="Body Score"      icon="🫀" color="var(--cyan)" trackColor="var(--cyan-dim)"    glowColor="var(--cyan)" />
                <ScoreRing value={scores.skinScore}      label="Skin Score"      icon="✨" color="var(--violet)" trackColor="var(--violet-dim)"  glowColor="var(--violet)" />
                <ScoreRing value={scores.lifestyleScore} label="Lifestyle Score" icon="🌿" color="var(--emerald)" trackColor="var(--emerald-dim)"   glowColor="var(--emerald)" />
              </section>
            </div>
            
            <div className="flex flex-col gap-3">
              <SectionTitle>Streak & Goals</SectionTitle>
              <div className="fade-up d2 glass p-5 flex flex-col justify-between h-full hover:border-[var(--border-hover)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] font-bold text-[var(--text-secondary)]">Consistency Streak</span>
                  <span className="badge badge-cyan text-[10px]">Active</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-syne font-extrabold text-4xl text-[var(--cyan)]">5</span>
                  <span className="text-xs text-[var(--text-muted)] font-semibold">Days Health Streak 🔥</span>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--border)]">
                  <div className="flex justify-between text-[11px] text-[var(--text-muted)] mb-1 font-semibold">
                    <span>Weekly Goal Progress</span>
                    <span>80%</span>
                  </div>
                  <div className="progress-bar-track h-1.5 rounded-full overflow-hidden bg-[var(--border)]">
                    <div className="progress-bar-fill h-full bg-[var(--cyan)]" style={{ width: "80%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── AI Insight + Today Summary ── */}
          <SectionTitle>AI Insights & Highlights</SectionTitle>
          <div className="fade-up d3 grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,360px)] gap-5 items-stretch">
            <InsightCard insight={result.lifestyle?.insight} loading={loading.lifestyle} />
            <TodaySummaryCard result={result} inputs={inputs} />
          </div>

          {/* ── Charts ── */}
          <SectionTitle>Analytics Trends</SectionTitle>
          <div className="fade-up d4">
            <ChartSection scores={scores} />
          </div>

          {/* ── Latest Insights + Habit Tracker ── */}
          <SectionTitle>Insights & Habits</SectionTitle>
          <div className="fade-up d5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="glass p-5 sm:p-6 h-full flex flex-col hover:border-[var(--border-hover)]">
              <SectionHeader icon="🫀" title="Body Insights" badge="Snapshot" badgeColor="cyan" />
              <div className="flex-1">
                {result.body ? (
                  <ResultBox>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="badge badge-cyan mono text-[10px]">BMI {result.body.bmi}</span>
                      <span className="font-semibold text-xs text-[var(--text-primary)]">{result.body.status}</span>
                    </div>
                    <p className="m-0 text-[13px] leading-relaxed text-[var(--text-secondary)]">{result.body.insight}</p>
                  </ResultBox>
                ) : (
                  <EmptyState 
                    icon="🫀"
                    title="No body data"
                    message="Run a body scan analysis to sync metrics here."
                    action={
                      <Link to="/analyze" className="btn btn-ghost text-xs h-8 px-4 py-0 flex items-center justify-center">
                        Scan Now
                      </Link>
                    }
                  />
                )}
              </div>
            </div>

            <div className="glass p-5 sm:p-6 h-full flex flex-col hover:border-[var(--border-hover)]">
              <SectionHeader icon="✨" title="Skin Analysis" badge="Vision AI" badgeColor="violet" />
              <div className="flex-1">
                {result.skin ? (
                  <ResultBox>
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {result.skin.detected.map((d) => (
                        <span key={d} className="badge badge-violet text-[9px]">{d}</span>
                      ))}
                    </div>
                    <p className="m-0 text-[13px] leading-relaxed text-[var(--text-secondary)]">{result.skin.insight}</p>
                  </ResultBox>
                ) : (
                  <EmptyState 
                    icon="✨"
                    title="No skin scan"
                    message="Upload a skin photo to view dermatological feedback."
                    action={
                      <Link to="/analyze" className="btn btn-ghost text-xs h-8 px-4 py-0 flex items-center justify-center">
                        Scan Photo
                      </Link>
                    }
                  />
                )}
              </div>
            </div>

            <HabitCard habitItems={habitItems} />
          </div>

          {/* ── Quick Actions and Recommendations ── */}
          <SectionTitle>Recommendations & Quick Actions</SectionTitle>
          <div className="fade-up d5 grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,360px)] gap-5">
            <div className="glass p-5 sm:p-6 hover:border-[var(--border-hover)] flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">💡</span>
                <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">Today's Recommendations</span>
              </div>
              <ul className="m-0 pl-4 text-[13.5px] text-[var(--text-secondary)] space-y-3 leading-relaxed">
                <li>🚶 Walk 10 mins post meals to optimize glucose response.</li>
                <li>💧 Complete 4 glasses of water before lunch (currently 3 logged).</li>
                <li>🥑 Include healthy fats (nuts, seeds) in your snack today.</li>
                <li>🛌 Maintain bedtime at 10:30 PM to recover sleep debt.</li>
              </ul>
            </div>
            
            <div className="glass p-5 sm:p-6 hover:border-[var(--border-hover)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">⚡</span>
                <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">Quick Actions</span>
              </div>
              <div className="flex flex-col gap-2">
                <Link to="/analyze" className="btn btn-cyan w-full text-center text-xs h-10">
                  Run Fresh Analysis
                </Link>
                <Link to="/coach" className="btn btn-ghost w-full text-center text-xs h-10">
                  💬 Chat with AI Coach
                </Link>
                <Link to="/calories" className="btn btn-ghost w-full text-center text-xs h-10">
                  🍽️ Log a Meal
                </Link>
              </div>
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="fade-up d6 glass p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mt-6 hover:border-[var(--cyan-glow)]">
            <div>
              <div className="section-label mb-1.5">Fresh Signals</div>
              <h3 className="display m-0 text-[17px] sm:text-[19px] text-[var(--text-primary)]">
                Sync fresh body and lifestyle analysis
              </h3>
              <p className="mt-1.5 mb-0 text-[13.5px] text-[var(--text-secondary)]">
                Takes under a minute — your results sync to the Results and History log automatically.
              </p>
            </div>
            <Link to="/analyze" className="btn btn-cyan w-full md:w-auto mt-0 whitespace-nowrap text-center justify-center shrink-0">
              Start Analysis →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
