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

/* ─── design tokens ──────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

  :root {
    --bg-base: #060910;
    --bg-surface: rgba(255,255,255,0.032);
    --bg-surface-hover: rgba(255,255,255,0.058);
    --bg-surface-2: rgba(255,255,255,0.06);
    --border: rgba(255,255,255,0.07);
    --border-accent: rgba(0,229,190,0.25);
    --cyan: #00e5be;
    --cyan-dim: rgba(0,229,190,0.12);
    --cyan-glow: rgba(0,229,190,0.18);
    --violet: #a78bfa;
    --violet-dim: rgba(167,139,250,0.12);
    --amber: #fbbf24;
    --amber-dim: rgba(251,191,36,0.12);
    --red: #f87171;
    --red-dim: rgba(248,113,113,0.12);
    --emerald: #34d399;
    --emerald-dim: rgba(52,211,153,0.12);
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --text-muted: #475569;
    --text-accent: #00e5be;
    --radius-sm: 10px;
    --radius-md: 14px;
    --radius-lg: 20px;
    --radius-xl: 26px;
    --shadow-card: 0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 40px rgba(0,0,0,0.5);
    --shadow-glow: 0 0 24px rgba(0,229,190,0.15);
  }

  * { box-sizing: border-box; }
  body {
    font-family: 'Instrument Sans', sans-serif;
    background: var(--bg-base);
    color: var(--text-primary);
    margin: 0;
  }
  .display { font-family: 'Syne', sans-serif; }
  .mono { font-family: 'JetBrains Mono', monospace; }

  /* mesh bg */
  .mesh-bg {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 70% 55% at 5% -5%, rgba(0,229,190,0.08) 0%, transparent 55%),
      radial-gradient(ellipse 50% 45% at 95% 95%, rgba(167,139,250,0.07) 0%, transparent 55%),
      radial-gradient(ellipse 35% 35% at 50% 40%, rgba(0,180,220,0.04) 0%, transparent 60%),
      linear-gradient(175deg, #070b12 0%, #060910 55%, #070c10 100%);
  }

  /* grid line watermark */
  .mesh-bg::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
    z-index: 0;
  }

  /* glass card */
  .glass {
    position: relative;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(24px) saturate(1.4);
    -webkit-backdrop-filter: blur(24px) saturate(1.4);
    box-shadow: var(--shadow-card);
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .glass::before {
    content: '';
    position: absolute;
    inset-x: 0;
    top: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent);
    pointer-events: none;
  }
  .glass:hover {
    border-color: rgba(255,255,255,0.10);
    box-shadow: var(--shadow-card), 0 0 0 1px rgba(255,255,255,0.03);
  }

  /* section label */
  .section-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  /* input */
  .field-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 13.5px;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .field-input::placeholder { color: var(--text-muted); }
  .field-input:focus {
    border-color: var(--border-accent);
    background: rgba(0,229,190,0.04);
    box-shadow: 0 0 0 3px rgba(0,229,190,0.08);
  }

  /* toggle */
  .toggle-track {
    width: 38px; height: 22px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.07);
    transition: all 0.2s;
    position: relative;
    flex-shrink: 0;
    cursor: pointer;
  }
  .toggle-track.on-cyan { background: var(--cyan); border-color: var(--cyan); box-shadow: 0 0 10px rgba(0,229,190,0.4); }
  .toggle-track.on-red { background: var(--red); border-color: var(--red); box-shadow: 0 0 10px rgba(248,113,113,0.35); }
  .toggle-track.on-emerald { background: var(--emerald); border-color: var(--emerald); box-shadow: 0 0 10px rgba(52,211,153,0.35); }
  .toggle-thumb {
    position: absolute; top: 2px; left: 2px;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
  }
  .toggle-track.on-cyan .toggle-thumb,
  .toggle-track.on-red .toggle-thumb,
  .toggle-track.on-emerald .toggle-thumb { transform: translateX(16px); }

  /* pill badge */
  .badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
  }
  .badge-cyan { background: var(--cyan-dim); border: 1px solid rgba(0,229,190,0.18); color: var(--cyan); }
  .badge-violet { background: var(--violet-dim); border: 1px solid rgba(167,139,250,0.2); color: var(--violet); }
  .badge-amber { background: var(--amber-dim); border: 1px solid rgba(251,191,36,0.2); color: var(--amber); }
  .badge-emerald { background: var(--emerald-dim); border: 1px solid rgba(52,211,153,0.2); color: var(--emerald); }

  /* result card */
  .result-box {
    margin-top: 14px;
    padding: 14px 16px;
    border-radius: var(--radius-md);
    background: rgba(0,229,190,0.04);
    border: 1px solid rgba(0,229,190,0.12);
    font-size: 13.5px;
    line-height: 1.65;
    color: var(--text-secondary);
  }

  /* empty */
  .empty-state {
    margin-top: 14px;
    padding: 20px;
    border-radius: var(--radius-md);
    border: 1px dashed rgba(255,255,255,0.07);
    text-align: center;
    font-size: 12px;
    color: var(--text-muted);
  }

  /* score ring */
  .score-ring-value {
    font-family: 'Syne', sans-serif;
    font-size: 32px;
    font-weight: 800;
    line-height: 1;
  }

  /* action btn */
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px;
    border-radius: var(--radius-md);
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.03em;
    cursor: pointer;
    border: none;
    transition: all 0.18s;
    margin-top: 16px;
  }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn:not(:disabled):hover { transform: translateY(-1px); }
  .btn:not(:disabled):active { transform: translateY(0); }

  .btn-cyan {
    background: linear-gradient(135deg, #00c9a7, #0891b2);
    color: #fff;
    box-shadow: 0 4px 16px rgba(0,180,150,0.3);
  }
  .btn-cyan:not(:disabled):hover { box-shadow: 0 6px 22px rgba(0,180,150,0.45); }

  .btn-violet {
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
    color: #fff;
    box-shadow: 0 4px 16px rgba(139,92,246,0.3);
  }
  .btn-violet:not(:disabled):hover { box-shadow: 0 6px 22px rgba(139,92,246,0.45); }

  .btn-amber {
    background: linear-gradient(135deg, #f59e0b, #ea580c);
    color: #fff;
    box-shadow: 0 4px 16px rgba(245,158,11,0.28);
  }
  .btn-amber:not(:disabled):hover { box-shadow: 0 6px 22px rgba(245,158,11,0.42); }

  .btn-emerald {
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff;
    box-shadow: 0 4px 16px rgba(16,185,129,0.28);
  }
  .btn-emerald:not(:disabled):hover { box-shadow: 0 6px 22px rgba(16,185,129,0.42); }

  .btn-ghost {
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    color: var(--text-secondary);
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.09); color: var(--text-primary); }

  /* upload zone */
  .upload-zone {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
    padding: 32px 20px;
    border-radius: var(--radius-md);
    border: 1px dashed rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.025);
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }
  .upload-zone:hover {
    border-color: rgba(0,229,190,0.3);
    background: rgba(0,229,190,0.04);
  }

  /* animations */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .fade-up { animation: fadeUp 0.5s ease-out both; }
  .d1 { animation-delay: 0.04s; }
  .d2 { animation-delay: 0.09s; }
  .d3 { animation-delay: 0.15s; }
  .d4 { animation-delay: 0.20s; }
  .d5 { animation-delay: 0.26s; }
  .d6 { animation-delay: 0.32s; }

  /* divider */
  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border), transparent);
    margin: 0;
  }

  /* stat item */
  .stat-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 9px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }
  .stat-row:last-child { border-bottom: none; }

  /* scrollbar */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
`;

/* ─── primitives ─────────────────────────────────────────────────────────── */

const Spinner = () => (
  <svg style={{ width: 14, height: 14, animation: "spin 0.8s linear infinite" }} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const FieldLabel = ({ children }) => (
  <span className="section-label" style={{ display: "block", marginBottom: 6 }}>{children}</span>
);

const Field = ({ label, ...props }) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    <FieldLabel>{label}</FieldLabel>
    <input className="field-input" {...props} />
  </div>
);

const ResultBox = ({ children }) =>
  children ? <div className="result-box">{children}</div> : null;

const EmptyState = ({ message }) => (
  <div className="empty-state">{message}</div>
);

const Toggle = ({ checked, onChange, color = "cyan" }) => (
  <div
    className={`toggle-track${checked ? ` on-${color}` : ""}`}
    onClick={() => onChange({ target: { checked: !checked } })}
  >
    <div className="toggle-thumb" />
  </div>
);

const ActionButton = ({ onClick, loading, disabled, color = "cyan", children }) => (
  <button
    className={`btn btn-${color}`}
    onClick={onClick}
    disabled={disabled || loading}
  >
    {loading && <Spinner />}
    {children}
  </button>
);

/* ─── ScoreRing ──────────────────────────────────────────────────────────── */
const ScoreRing = ({ value, label, icon, color, trackColor, glowColor }) => {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;

  return (
    <div className="glass" style={{ padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
      <div style={{ position: "relative", width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke={trackColor} strokeWidth="7" />
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ filter: `drop-shadow(0 0 8px ${glowColor})`, transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <span style={{ fontSize: 26, zIndex: 1 }}>{icon}</span>
      </div>
      <div>
        <div className="score-ring-value" style={{ color }}>{value}</div>
        <div className="section-label" style={{ marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
};

/* ─── SectionHeader ──────────────────────────────────────────────────────── */
const SectionHeader = ({ icon, title, badge, badgeColor = "cyan" }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 34, height: 34,
        borderRadius: 10,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16,
      }}>
        {icon}
      </div>
      <span className="display" style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{title}</span>
    </div>
    {badge && <span className={`badge badge-${badgeColor}`}>{badge}</span>}
  </div>
);

/* ─── main page ──────────────────────────────────────────────────────────── */
export default function DashboardPage({ user }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({});
  const [habitItems, setHabitItems] = useState({ water: true, sleep: false, protein: true });
  const [food, setFood] = useState("");
  const [inputs, setInputs] = useState({
    weight: "", height: "", age: "", gender: "",
    diet: "", activity: "", sleep: "",
  });
  const [lifestyle, setLifestyle] = useState({
    smoking: false, alcohol: false, sleepHours: "", screenTime: "",
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

  const signOut = async () => { await supabase.auth.signOut(); };

  const inputFields = [
    { key: "weight", label: "Weight", placeholder: "e.g. 70 kg" },
    { key: "height", label: "Height", placeholder: "e.g. 172 cm" },
    { key: "age", label: "Age", placeholder: "e.g. 26" },
    { key: "gender", label: "Gender", placeholder: "male / female / other" },
    { key: "diet", label: "Diet type", placeholder: "balanced / vegan / keto" },
    { key: "activity", label: "Activity (days/wk)", placeholder: "e.g. 4" },
    { key: "sleep", label: "Sleep (hrs/night)", placeholder: "e.g. 7" },
  ];

  return (
    <>
      <style>{CSS}</style>

      <div className="mesh-bg" style={{ position: "relative", zIndex: 0 }}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "32px 20px 64px" }}>

          {/* ── header ── */}
          <header className="fade-up" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span className="badge badge-cyan">
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cyan)", animation: "pulse 1.8s ease-in-out infinite" }} />
                  Live Intelligence
                </span>
              </div>
              <h1 className="display" style={{ margin: 0, fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#fff", lineHeight: 1.1 }}>
                BodyWise{" "}
                <span style={{ background: "linear-gradient(135deg, #00e5be, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  AI
                </span>
              </h1>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-muted)" }}>
                Personal body & skin intelligence — powered by AI
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>
                <div className="mono" style={{ color: "var(--text-secondary)", fontSize: 13 }}>{user?.email}</div>
                <div style={{ fontSize: 11, marginTop: 2 }}>Signed in</div>
              </div>
              <button className="btn btn-ghost" style={{ marginTop: 0 }} onClick={signOut}>
                Sign out
              </button>
            </div>
          </header>

          {/* ── SECTION: Health Scores ── */}
          <div className="fade-up d1" style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span className="section-label">Health Scores</span>
              <div className="divider" style={{ flex: 1 }} />
            </div>
          </div>
          <section className="fade-up d1" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
            marginBottom: 40,
          }}>
            <ScoreRing value={scores.bodyScore} label="Body Score" icon="🫀"
              color="#00e5be" trackColor="rgba(0,229,190,0.10)" glowColor="rgba(0,229,190,0.5)" />
            <ScoreRing value={scores.skinScore} label="Skin Score" icon="✨"
              color="#a78bfa" trackColor="rgba(167,139,250,0.10)" glowColor="rgba(167,139,250,0.5)" />
            <ScoreRing value={scores.lifestyleScore} label="Lifestyle Score" icon="🌿"
              color="#34d399" trackColor="rgba(52,211,153,0.10)" glowColor="rgba(52,211,153,0.5)" />
          </section>

          {/* ── SECTION: Body Analysis ── */}
          <div className="fade-up d2" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span className="section-label">Body Analysis</span>
            <div className="divider" style={{ flex: 1 }} />
          </div>

          <div className="fade-up d2" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 14,
            marginBottom: 40,
          }}>
            {/* body analyzer */}
            <div className="glass" style={{ padding: 24 }}>
              <SectionHeader icon="🫀" title="Body Reaction Analyzer" badge="BMI + Prediction" badgeColor="cyan" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {inputFields.map(({ key, label, placeholder }) => (
                  <div key={key} style={key === "diet" ? { gridColumn: "1 / -1" } : {}}>
                    <Field
                      label={label}
                      value={inputs[key]}
                      placeholder={placeholder}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <ActionButton onClick={runAnalysis} loading={loading} color="cyan">
                {loading ? "Analyzing…" : "Run Body + Skin + Prediction"}
              </ActionButton>

              {result.body ? (
                <ResultBox>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    <span className="badge badge-cyan mono">BMI {result.body.bmi}</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{result.body.status}</span>
                  </div>
                  <p style={{ margin: "0 0 10px", color: "var(--text-secondary)" }}>{result.body.insight}</p>
                  {result.prediction && (
                    <div style={{ paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 12.5, color: "var(--text-muted)" }}>
                      <span>📈 {result.prediction.weightTrend}</span>
                      <span style={{ margin: "0 8px" }}>·</span>
                      <span>Skin risk: {result.prediction.skinConditionRisk}</span>
                    </div>
                  )}
                </ResultBox>
              ) : (
                <EmptyState message="Fill in your metrics and run analysis to see results" />
              )}
            </div>

            {/* skin analyzer */}
            <div className="glass" style={{ padding: 24 }}>
              <SectionHeader icon="✨" title="Skin Health Analyzer" badge="AI Vision" badgeColor="violet" />
              <FieldLabel>Upload skin photo</FieldLabel>
              <label className="upload-zone">
                <span style={{ fontSize: 32 }}>📸</span>
                <span style={{ fontSize: 13.5, color: "var(--text-secondary)", fontWeight: 500 }}>Drop image or click to upload</span>
                <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>JPG, PNG, WEBP up to 10 MB</span>
                <input type="file" accept="image/*" style={{ display: "none" }} />
              </label>
              <p style={{ marginTop: 10, fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Image analysis is simulated in this MVP — backend returns AI-generated insights.
              </p>

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
                <EmptyState message="Run body analysis above to populate skin insights" />
              )}
            </div>
          </div>

          {/* ── SECTION: Habits & Nutrition ── */}
          <div className="fade-up d3" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span className="section-label">Habits &amp; Nutrition</span>
            <div className="divider" style={{ flex: 1 }} />
          </div>

          <div className="fade-up d3" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 14,
            marginBottom: 40,
          }}>
            {/* habit coach */}
            <div className="glass" style={{ padding: 24 }}>
              <SectionHeader icon="📋" title="Daily Habit Coach" badge="Today" badgeColor="emerald" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.keys(habitItems).map((item) => (
                  <label key={item} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: var_radius_md,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-surface-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = "var(--bg-surface)"}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 500, textTransform: "capitalize", color: "var(--text-primary)" }}>
                      {item === "water" ? "💧 " : item === "sleep" ? "😴 " : "🥩 "}{item}
                    </span>
                    <Toggle
                      checked={habitItems[item]}
                      onChange={(e) => setHabitItems((prev) => ({ ...prev, [item]: e.target.checked }))}
                      color="emerald"
                    />
                  </label>
                ))}
              </div>
              <ActionButton onClick={saveHabit} color="emerald">Save Today's Habits</ActionButton>
              {result.habits?.length ? (
                <p className="mono" style={{ marginTop: 12, fontSize: 11.5, color: "var(--text-muted)" }}>
                  {result.habits.length} entries stored
                </p>
              ) : (
                <EmptyState message="No habit entries logged yet" />
              )}
            </div>

            {/* food intelligence */}
            <div className="glass" style={{ padding: 24 }}>
              <SectionHeader icon="🥗" title="Food Intelligence" badge="Nutrition AI" badgeColor="violet" />
              <FieldLabel>Describe your meal</FieldLabel>
              <input
                className="field-input"
                value={food}
                onChange={(e) => setFood(e.target.value)}
                placeholder="e.g. grilled chicken salad with olive oil"
              />
              <ActionButton onClick={runFood} loading={loading} color="violet" disabled={!food.trim()}>
                {loading ? "Analyzing…" : "Analyze Food"}
              </ActionButton>

              {result.food ? (
                <ResultBox>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, color: "var(--violet)" }}>{result.food.food}</span>
                    <span className="badge badge-cyan mono">{result.food.estimatedCalories} kcal</span>
                  </div>
                  <p style={{ margin: 0, color: "var(--text-secondary)" }}>{result.food.insight}</p>
                </ResultBox>
              ) : (
                <EmptyState message="Enter a meal description and analyze to see nutritional insights" />
              )}
            </div>
          </div>

          {/* ── SECTION: Lifestyle ── */}
          <div className="fade-up d4" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span className="section-label">Lifestyle Analysis</span>
            <div className="divider" style={{ flex: 1 }} />
          </div>

          <div className="fade-up d4 glass" style={{ padding: 28, marginBottom: 40 }}>
            <SectionHeader icon="🌿" title="Lifestyle Analyzer" badge="Holistic View" badgeColor="amber" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              {[
                { key: "smoking", label: "Smoking", icon: "🚬" },
                { key: "alcohol", label: "Alcohol", icon: "🍷" },
              ].map(({ key, label, icon }) => (
                <label key={key} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: var_radius_md,
                  background: "var(--bg-surface)",
                  border: `1px solid ${lifestyle[key] ? "rgba(248,113,113,0.2)" : "var(--border)"}`,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{icon}</span>{label}
                  </span>
                  <Toggle
                    checked={lifestyle[key]}
                    onChange={(e) => setLifestyle((p) => ({ ...p, [key]: e.target.checked }))}
                    color="red"
                  />
                </label>
              ))}
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
              <ResultBox>{result.lifestyle.insight}</ResultBox>
            ) : (
              <EmptyState message="Configure your lifestyle factors above and run analysis" />
            )}
          </div>

          {/* ── footer ── */}
          <footer className="fade-up d6" style={{
            borderTop: "1px solid var(--border)",
            paddingTop: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}>
            <span className="display" style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
              BodyWise <span style={{ color: "var(--cyan)" }}>AI</span>
            </span>
            <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
              All insights are informational only · Not medical advice
            </span>
          </footer>

        </div>
      </div>
    </>
  );
}

/* ─── inline const to avoid template literal issues ─────────────────────── */
const var_radius_md = "var(--radius-md)";
