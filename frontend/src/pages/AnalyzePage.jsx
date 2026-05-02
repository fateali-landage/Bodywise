import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBodyWise } from "../context/BodyWiseContext";
import {
  ActionButton,
  EmptyState,
  ErrorBanner,
  Field,
  FieldLabel,
  PageHeader,
  ResultBox,
  SectionHeader,
  SectionTitle,
  Toggle,
} from "../components/ui";
import RadioGroup from "../components/ui/RadioGroup";

const GENDER_OPTS = [
  { value: "male",   label: "Male",   icon: "♂️" },
  { value: "female", label: "Female", icon: "♀️" },
  { value: "other",  label: "Other",  icon: "⚧"  },
];

const DIET_OPTS = [
  { value: "balanced",     label: "Balanced",     icon: "🥗" },
  { value: "vegan",        label: "Vegan",        icon: "🌱" },
  { value: "keto",         label: "Keto",         icon: "🥩" },
  { value: "high-protein", label: "High Protein", icon: "💪" },
];

const numericFields = [
  { key: "weight",   label: "Weight",            placeholder: "e.g. 70 kg" },
  { key: "height",   label: "Height",            placeholder: "e.g. 172 cm" },
  { key: "age",      label: "Age",               placeholder: "e.g. 26" },
  { key: "activity", label: "Activity (days/wk)", placeholder: "e.g. 4" },
  { key: "sleep",    label: "Sleep (hrs/night)",  placeholder: "e.g. 7" },
];

const HABIT_COLORS = {
  smoking:  { color: "#f87171", dim: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.25)" },
  alcohol:  { color: "#fbbf24", dim: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.25)"  },
  _default: { color: "#a78bfa", dim: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.25)" },
};

export default function AnalyzePage() {
  const navigate  = useNavigate();
  const {
    inputs, setInputs,
    lifestyle, setLifestyle,
    result, runAnalysis, runLifestyle,
    loading, error, setError,
  } = useBodyWise();

  /* Custom habits state */
  const [customHabits, setCustomHabits] = useState([]); // [{ id, name, active }]
  const [newHabitInput, setNewHabitInput] = useState("");
  const [showHabitInput, setShowHabitInput] = useState(false);
  const [habitError, setHabitError] = useState("");

  const handleRunBody = async () => {
    await runAnalysis();
    navigate("/results");
  };

  const addCustomHabit = () => {
    const name = newHabitInput.trim();
    if (!name) { setHabitError("Please enter a habit name."); return; }
    if (customHabits.some((h) => h.name.toLowerCase() === name.toLowerCase())) {
      setHabitError("Habit already added.");
      return;
    }
    setCustomHabit(name);
  };

  const setCustomHabit = (name) => {
    setCustomHabits((prev) => [...prev, { id: Date.now(), name, active: false }]);
    setNewHabitInput("");
    setShowHabitInput(false);
    setHabitError("");
  };

  const toggleCustomHabit = (id) =>
    setCustomHabits((prev) => prev.map((h) => h.id === id ? { ...h, active: !h.active } : h));

  const removeCustomHabit = (id) =>
    setCustomHabits((prev) => prev.filter((h) => h.id !== id));

  const handleRunLifestyle = async () => {
    const payload = {
      ...lifestyle,
      customHabits: customHabits.filter((h) => h.active).map((h) => h.name),
    };
    // Merge custom habits into lifestyle before sending
    await runLifestyle(payload);
  };

  const builtinHabits = [
    { key: "smoking", label: "Smoking", icon: "🚬" },
    { key: "alcohol", label: "Alcohol", icon: "🍷" },
  ];

  return (
    <>
      <ErrorBanner message={error} onDismiss={() => setError(null)} />
      <PageHeader
        title="Analyze"
        description="Provide your data — we'll generate body, skin and lifestyle insights."
      />

      {/* ─── Body Analysis ─── */}
      <SectionTitle>Body Analysis</SectionTitle>
      <div className="fade-up d2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14, marginBottom: 40 }}>
        <div className="glass" style={{ padding: 24 }}>
          <SectionHeader icon="🫀" title="Body Reaction Analyzer" badge="BMI + Prediction" badgeColor="cyan" />

          {/* Gender selector */}
          <div style={{ marginBottom: 14 }}>
            <FieldLabel>Gender</FieldLabel>
            <div style={{ marginTop: 6 }}>
              <RadioGroup
                options={GENDER_OPTS}
                value={inputs.gender}
                onChange={(v) => setInputs((p) => ({ ...p, gender: v }))}
                color="cyan"
              />
            </div>
          </div>

          {/* Diet selector */}
          <div style={{ marginBottom: 14 }}>
            <FieldLabel>Diet Type</FieldLabel>
            <div style={{ marginTop: 6 }}>
              <RadioGroup
                options={DIET_OPTS}
                value={inputs.diet}
                onChange={(v) => setInputs((p) => ({ ...p, diet: v }))}
                color="violet"
              />
            </div>
          </div>

          {/* Numeric fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
            {numericFields.map(({ key, label, placeholder }) => (
              <Field
                key={key}
                label={label}
                value={inputs[key]}
                placeholder={placeholder}
                type="number"
                onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            ))}
          </div>

          <ActionButton onClick={handleRunBody} loading={loading.body} color="cyan">
            {loading.body ? "Analyzing…" : "Run Body + Skin + Prediction"}
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

        {/* Skin */}
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
            <EmptyState message="Run body analysis to populate skin insights" />
          )}
        </div>
      </div>

      {/* ─── Lifestyle Analysis ─── */}
      <SectionTitle>Lifestyle Analysis</SectionTitle>
      <div className="fade-up d3 glass" style={{ padding: 28, marginBottom: 40 }}>
        <SectionHeader icon="🌿" title="Lifestyle Analyzer" badge="Holistic View" badgeColor="amber" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>

          {/* Built-in habit toggles */}
          {builtinHabits.map(({ key, label, icon }) => {
            const c = HABIT_COLORS[key] || HABIT_COLORS._default;
            const on = lifestyle[key];
            return (
              <div key={key} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", borderRadius: "var(--radius-md)",
                background: on ? c.dim : "var(--bg-surface)",
                border: `1px solid ${on ? c.border : "var(--border)"}`,
                transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{icon}</span>{label}
                </span>
                <Toggle
                  checked={on}
                  onChange={(e) => setLifestyle((p) => ({ ...p, [key]: e.target.checked }))}
                  color="red"
                />
              </div>
            );
          })}

          {/* Custom habit cards */}
          {customHabits.map(({ id, name, active }) => {
            const c = HABIT_COLORS._default;
            return (
              <div key={id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", borderRadius: "var(--radius-md)",
                background: active ? c.dim : "var(--bg-surface)",
                border: `1px solid ${active ? c.border : "var(--border)"}`,
                transition: "all 0.15s", gap: 8,
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", flex: 1, display: "flex", alignItems: "center", gap: 7 }}>
                  <span>🔁</span>
                  <span style={{ textTransform: "capitalize" }}>{name}</span>
                </span>
                <Toggle
                  checked={active}
                  onChange={() => toggleCustomHabit(id)}
                  color="emerald"
                />
                <button
                  onClick={() => removeCustomHabit(id)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "2px 3px", borderRadius: 6, transition: "color 0.15s", flexShrink: 0 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  aria-label="Remove habit"
                >✕</button>
              </div>
            );
          })}

          <Field
            label="Sleep hours / night"
            value={lifestyle.sleepHours}
            placeholder="e.g. 7"
            type="number"
            onChange={(e) => setLifestyle((p) => ({ ...p, sleepHours: e.target.value }))}
          />
          <Field
            label="Screen time (hrs/day)"
            value={lifestyle.screenTime}
            placeholder="e.g. 6"
            type="number"
            onChange={(e) => setLifestyle((p) => ({ ...p, screenTime: e.target.value }))}
          />
        </div>

        {/* Add Custom Habit */}
        <div style={{ marginTop: 16 }}>
          {showHabitInput ? (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <FieldLabel>Custom habit name</FieldLabel>
                <input
                  className="field-input"
                  value={newHabitInput}
                  onChange={(e) => { setNewHabitInput(e.target.value); setHabitError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && addCustomHabit()}
                  placeholder="e.g. Caffeine, Gaming, Late Night Snack"
                  autoFocus
                />
                {habitError && <span style={{ fontSize: 11, color: "var(--red)", marginTop: 4, display: "block" }}>⚠ {habitError}</span>}
              </div>
              <button className="btn btn-violet" style={{ marginTop: 0 }} onClick={addCustomHabit}>Add</button>
              <button className="btn btn-ghost" style={{ marginTop: 0 }} onClick={() => { setShowHabitInput(false); setHabitError(""); }}>Cancel</button>
            </div>
          ) : (
            <button
              className="btn btn-ghost"
              style={{ marginTop: 0, borderStyle: "dashed" }}
              onClick={() => setShowHabitInput(true)}
            >
              + Add Custom Habit
            </button>
          )}
        </div>

        <ActionButton onClick={handleRunLifestyle} loading={loading.lifestyle} color="amber">
          {loading.lifestyle ? "Analyzing…" : "Analyze Lifestyle"}
        </ActionButton>
        {result.lifestyle ? (
          <ResultBox>{result.lifestyle.insight}</ResultBox>
        ) : (
          <EmptyState message="Configure your lifestyle factors above and run analysis" />
        )}
      </div>
    </>
  );
}
