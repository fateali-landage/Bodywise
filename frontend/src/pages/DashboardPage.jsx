import { useMemo, useState } from "react";
import Card from "../components/Card";
import ScoreBar from "../components/ScoreBar";
import {
  analyzeBody,
  analyzeFood,
  analyzeLifestyle,
  analyzeSkin,
  createHabit,
  listHabits,
  predictHealth,
} from "../services/api";
import { supabase } from "../services/supabaseClient";

/* ─── tiny reusable primitives ─────────────────────────────────────────── */

const Spinner = () => (
  <svg
    className="h-4 w-4 animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

const Label = ({ children }) => (
  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-cyan-400/70">
    {children}
  </span>
);

const Field = ({ label, ...props }) => (
  <div className="flex flex-col">
    <Label>{label}</Label>
    <input
      {...props}
      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none ring-0 transition-all duration-200 focus:border-cyan-400/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-400/20"
    />
  </div>
);

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300 ${className}`}
  >
    {/* subtle top-edge highlight */}
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
    {children}
  </div>
);

const SectionTitle = ({ icon, children }) => (
  <div className="mb-5 flex items-center gap-2.5">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 text-base">
      {icon}
    </span>
    <h2 className="text-base font-semibold tracking-tight text-slate-100">{children}</h2>
  </div>
);

const ActionButton = ({ onClick, loading, disabled, color = "cyan", children }) => {
  const palette = {
    cyan: "from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 focus:ring-cyan-400/30",
    emerald: "from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 focus:ring-emerald-400/30",
    violet: "from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 focus:ring-violet-400/30",
    amber: "from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 focus:ring-amber-400/30",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 ${palette[color]}`}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
};

const ScoreRing = ({ value, label, icon }) => {
  const color =
    value >= 80 ? "#22d3ee" : value >= 50 ? "#f59e0b" : "#ef4444";
  const trackColor =
    value >= 80 ? "rgba(34,211,238,0.12)" : value >= 50 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)";
  const circumference = 2 * Math.PI * 36;
  const dash = (value / 100) * circumference;

  return (
    <GlassCard className="flex flex-col items-center gap-3 py-8">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke={trackColor} strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dasharray 1s ease-out" }}
          />
        </svg>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold tabular-nums" style={{ color }}>
          {value}
        </p>
        <p className="mt-0.5 text-xs font-medium uppercase tracking-widest text-slate-400">{label}</p>
      </div>
    </GlassCard>
  );
};

const ResultPill = ({ children }) =>
  children ? (
    <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm leading-relaxed text-slate-300">
      {children}
    </div>
  ) : null;

const EmptyState = ({ message }) => (
  <p className="mt-4 rounded-xl border border-dashed border-white/10 py-4 text-center text-xs text-slate-500">
    {message}
  </p>
);

/* ─── main page ─────────────────────────────────────────────────────────── */

export default function DashboardPage({ user }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({});
  const [habitItems, setHabitItems] = useState({ water: true, sleep: false, protein: true });
  const [food, setFood] = useState("");
  const [inputs, setInputs] = useState({
    weight: "",
    height: "",
    age: "",
    gender: "",
    diet: "",
    activity: "",
    sleep: "",
  });
  const [lifestyle, setLifestyle] = useState({
    smoking: false,
    alcohol: false,
    sleepHours: "",
    screenTime: "",
  });

  const scores = useMemo(() => {
    const bodyScore = Math.max(40, 100 - Math.abs((result.body?.bmi || 22) - 22) * 6);
    const skinScore = result.skin?.concernLevel === "medium" ? 68 : 82;
    const lifestyleScore = result.lifestyle?.lifestyleScore || 74;
    return {
      bodyScore: Math.round(bodyScore),
      skinScore: Math.round(skinScore),
      lifestyleScore: Math.round(lifestyleScore),
    };
  }, [result]);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const [bodyRes, skinRes, predRes] = await Promise.all([
        analyzeBody(inputs),
        analyzeSkin({ concern: "mild dryness" }),
        predictHealth({ weight: inputs.weight, activity: inputs.activity, sleep: inputs.sleep }),
      ]);
      setResult((prev) => ({
        ...prev,
        body: bodyRes.data.data,
        skin: skinRes.data.data,
        prediction: predRes.data.data,
      }));
    } finally {
      setLoading(false);
    }
  };

  const runFood = async () => {
    setLoading(true);
    try {
      const { data } = await analyzeFood({ food });
      setResult((prev) => ({ ...prev, food: data.data }));
    } finally {
      setLoading(false);
    }
  };

  const runLifestyle = async () => {
    setLoading(true);
    try {
      const { data } = await analyzeLifestyle(lifestyle);
      setResult((prev) => ({ ...prev, lifestyle: data.data }));
    } finally {
      setLoading(false);
    }
  };

  const saveHabit = async () => {
    await createHabit({ user_id: user.id, ...habitItems, date: new Date().toISOString().slice(0, 10) });
    const { data } = await listHabits(user.id);
    setResult((prev) => ({ ...prev, habits: data.data }));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const inputFields = [
    { key: "weight", label: "Weight", placeholder: "e.g. 70 kg" },
    { key: "height", label: "Height", placeholder: "e.g. 172 cm" },
    { key: "age", label: "Age", placeholder: "e.g. 26" },
    { key: "gender", label: "Gender", placeholder: "male / female / other" },
    { key: "diet", label: "Diet type", placeholder: "balanced / vegan / keto…" },
    { key: "activity", label: "Activity (days/week)", placeholder: "e.g. 4" },
    { key: "sleep", label: "Sleep (hrs/night)", placeholder: "e.g. 7" },
  ];

  return (
    <>
      {/* ── ambient background ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
        .mono { font-family: 'DM Mono', monospace; }
        .mesh {
          background:
            radial-gradient(ellipse 80% 60% at 10% 0%, rgba(6,182,212,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 90% 100%, rgba(16,185,129,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 70%),
            linear-gradient(160deg, #020817 0%, #050d1a 50%, #020a10 100%);
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease-out both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.10s; }
        .fade-up-3 { animation-delay: 0.15s; }
        .fade-up-4 { animation-delay: 0.20s; }
        .fade-up-5 { animation-delay: 0.25s; }
        .fade-up-6 { animation-delay: 0.30s; }
      `}</style>

      <div className="mesh min-h-screen text-slate-100">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-10 md:py-12">

          {/* ── header ── */}
          <header className="fade-up flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Live Intelligence
              </div>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
                BodyWise <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">AI</span>
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Your personal body & skin intelligence layer — powered by AI
              </p>
            </div>
            <button
              onClick={signOut}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 backdrop-blur transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Sign out
            </button>
          </header>

          {/* ── score rings ── */}
          <section className="fade-up fade-up-1 grid gap-4 md:grid-cols-3">
            <ScoreRing value={scores.bodyScore} label="Body Score" icon="🫀" />
            <ScoreRing value={scores.skinScore} label="Skin Score" icon="✨" />
            <ScoreRing value={scores.lifestyleScore} label="Lifestyle Score" icon="🌿" />
          </section>

          {/* ── main grid ── */}
          <div className="grid gap-6 lg:grid-cols-2">

            {/* body analyzer */}
            <GlassCard className="fade-up fade-up-2">
              <SectionTitle icon="🫀">Body Reaction Analyzer</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                {inputFields.map(({ key, label, placeholder }) => (
                  <Field
                    key={key}
                    label={label}
                    value={inputs[key]}
                    placeholder={placeholder}
                    onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                ))}
              </div>
              <ActionButton onClick={runAnalysis} loading={loading} color="cyan">
                {loading ? "Analyzing…" : "Run Body + Skin + Prediction"}
              </ActionButton>
              {result.body ? (
                <ResultPill>
                  <span className="mono font-medium text-cyan-300">BMI {result.body.bmi}</span>
                  {" — "}
                  {result.body.status}. {result.body.insight}
                  {result.prediction && (
                    <p className="mt-2 text-slate-400">
                      📈 {result.prediction.weightTrend} &nbsp;·&nbsp; Skin risk:{" "}
                      {result.prediction.skinConditionRisk}
                    </p>
                  )}
                </ResultPill>
              ) : (
                <EmptyState message="Fill in your metrics and run analysis to see results" />
              )}
            </GlassCard>

            {/* skin analyzer */}
            <GlassCard className="fade-up fade-up-2">
              <SectionTitle icon="✨">Skin Health Analyzer</SectionTitle>
              <div className="flex flex-col gap-2">
                <Label>Upload skin photo</Label>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/5 py-8 text-sm text-slate-400 transition hover:border-cyan-400/30 hover:bg-white/10 hover:text-slate-300">
                  <span className="text-2xl">📸</span>
                  <span>Drop image or click to upload</span>
                  <input type="file" accept="image/*" className="hidden" />
                </label>
                <p className="text-[11px] text-slate-500">
                  Image analysis is simulated in this MVP — backend returns AI-generated insights.
                </p>
              </div>
              {result.skin ? (
                <ResultPill>
                  <span className="font-medium text-cyan-300">Detected:</span>{" "}
                  {result.skin.detected.join(", ")}
                  <br />
                  <span className="text-slate-400">{result.skin.insight}</span>
                </ResultPill>
              ) : (
                <EmptyState message="Run body analysis above to populate skin insights" />
              )}
            </GlassCard>

            {/* habit coach */}
            <GlassCard className="fade-up fade-up-3">
              <SectionTitle icon="📋">Daily Habit Coach</SectionTitle>
              <div className="space-y-3">
                {Object.keys(habitItems).map((item) => (
                  <label
                    key={item}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
                  >
                    <span className="text-sm font-medium capitalize text-slate-200">{item}</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={habitItems[item]}
                        onChange={(e) => setHabitItems((prev) => ({ ...prev, [item]: e.target.checked }))}
                        className="sr-only"
                      />
                      <div
                        className={`h-5 w-9 rounded-full border transition-colors duration-200 ${
                          habitItems[item]
                            ? "border-emerald-400/40 bg-emerald-500"
                            : "border-white/20 bg-white/10"
                        }`}
                      >
                        <div
                          className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                            habitItems[item] ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <ActionButton onClick={saveHabit} color="emerald">
                Save Today's Habits
              </ActionButton>
              {result.habits?.length ? (
                <p className="mt-3 text-xs text-slate-500 mono">
                  {result.habits.length} entries stored
                </p>
              ) : (
                <EmptyState message="No habit entries logged yet" />
              )}
            </GlassCard>

            {/* food intelligence */}
            <GlassCard className="fade-up fade-up-3">
              <SectionTitle icon="🥗">Food Intelligence</SectionTitle>
              <div className="flex flex-col gap-1">
                <Label>Describe your meal</Label>
                <input
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:border-cyan-400/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-400/20"
                  value={food}
                  onChange={(e) => setFood(e.target.value)}
                  placeholder="e.g. grilled chicken salad with olive oil"
                />
              </div>
              <ActionButton onClick={runFood} loading={loading} color="violet" disabled={!food.trim()}>
                {loading ? "Analyzing…" : "Analyze Food"}
              </ActionButton>
              {result.food ? (
                <ResultPill>
                  <span className="font-medium text-violet-300">{result.food.food}</span>
                  {" — "}
                  <span className="mono text-cyan-300">{result.food.estimatedCalories} kcal</span>
                  <p className="mt-1 text-slate-400">{result.food.insight}</p>
                </ResultPill>
              ) : (
                <EmptyState message="Enter a meal description and analyze to see nutritional insights" />
              )}
            </GlassCard>

            {/* lifestyle analyzer — full width */}
            <GlassCard className="fade-up fade-up-4 lg:col-span-2">
              <SectionTitle icon="🌿">Lifestyle Analyzer</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* toggles */}
                {[
                  { key: "smoking", label: "Smoking", icon: "🚬" },
                  { key: "alcohol", label: "Alcohol", icon: "🍷" },
                ].map(({ key, label, icon }) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                      <span>{icon}</span> {label}
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={lifestyle[key]}
                        onChange={(e) => setLifestyle((p) => ({ ...p, [key]: e.target.checked }))}
                        className="sr-only"
                      />
                      <div
                        className={`h-5 w-9 rounded-full border transition-colors duration-200 ${
                          lifestyle[key]
                            ? "border-red-400/40 bg-red-500"
                            : "border-white/20 bg-white/10"
                        }`}
                      >
                        <div
                          className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                            lifestyle[key] ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </div>
                  </label>
                ))}
                {/* numeric fields */}
                <Field
                  label="Sleep hours / night"
                  value={lifestyle.sleepHours}
                  placeholder="e.g. 7"
                  onChange={(e) => setLifestyle((p) => ({ ...p, sleepHours: e.target.value }))}
                />
                <Field
                  label="Screen time (hrs/day)"
                  value={lifestyle.screenTime}
                  placeholder="e.g. 6"
                  onChange={(e) => setLifestyle((p) => ({ ...p, screenTime: e.target.value }))}
                />
              </div>
              <ActionButton onClick={runLifestyle} loading={loading} color="amber">
                {loading ? "Analyzing…" : "Analyze Lifestyle"}
              </ActionButton>
              {result.lifestyle ? (
                <ResultPill>{result.lifestyle.insight}</ResultPill>
              ) : (
                <EmptyState message="Configure your lifestyle factors above and run analysis" />
              )}
            </GlassCard>
          </div>

          {/* footer */}
          <footer className="fade-up fade-up-6 border-t border-white/5 pt-6 text-center text-xs text-slate-600">
            BodyWise AI · All insights are informational only, not medical advice
          </footer>
        </div>
      </div>
    </>
  );
}
