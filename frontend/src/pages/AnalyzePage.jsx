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
    const { weight, height, age, activity, sleep, gender, diet } = inputs;
    if (!weight || !height || !age || !activity || !sleep || !gender || !diet) {
      setError("Please fill in all body metrics before analyzing.");
      return;
    }
    setError(null);
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
      <div className="fade-up d2 grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10 items-stretch">
        <div className="glass p-5 sm:p-6 flex flex-col h-full">
          <SectionHeader icon="🫀" title="Body Reaction Analyzer" badge="BMI + Prediction" badgeColor="cyan" />

          {/* Gender selector */}
          <div className="mb-4 mt-4">
            <FieldLabel>Gender</FieldLabel>
            <div className="mt-1.5">
              <RadioGroup
                options={GENDER_OPTS}
                value={inputs.gender}
                onChange={(v) => setInputs((p) => ({ ...p, gender: v }))}
                color="cyan"
              />
            </div>
          </div>

          {/* Diet selector */}
          <div className="mb-4">
            <FieldLabel>Diet Type</FieldLabel>
            <div className="mt-1.5">
              <RadioGroup
                options={DIET_OPTS}
                value={inputs.diet}
                onChange={(v) => setInputs((p) => ({ ...p, diet: v }))}
                color="violet"
              />
            </div>
          </div>

          {/* Numeric fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
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

          <ActionButton onClick={handleRunBody} loading={loading.body} color="cyan" className="mt-4">
            {loading.body ? "Analyzing…" : "Run Body + Skin + Prediction"}
          </ActionButton>

          <div className="mt-4">
            {result.body ? (
              <ResultBox>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="badge badge-cyan mono">BMI {result.body.bmi}</span>
                  <span className="font-medium text-[var(--text-primary)]">{result.body.status}</span>
                </div>
                <p className="m-0 mb-2 text-[var(--text-secondary)]">{result.body.insight}</p>
                {result.prediction && (
                  <div className="pt-2.5 border-t border-[var(--border)] text-[12.5px] text-[var(--text-muted)] mt-3">
                    <span>📈 {result.prediction.weightTrend}</span>
                    <span className="mx-2">·</span>
                    <span>Skin risk: {result.prediction.skinConditionRisk}</span>
                  </div>
                )}
              </ResultBox>
            ) : (
              <EmptyState message="Fill in your metrics and run analysis to see results" />
            )}
          </div>
        </div>

        {/* Skin */}
        <div className="glass p-5 sm:p-6 flex flex-col h-full">
          <SectionHeader icon="✨" title="Skin Health Analyzer" badge="AI Vision" badgeColor="violet" />
          <div className="mt-4">
            <FieldLabel>Upload skin photo</FieldLabel>
            <label className="upload-zone mt-2 flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-[var(--radius-md)] cursor-pointer bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-colors">
              <span className="text-3xl mb-2">📸</span>
              <span className="text-[13.5px] font-medium text-[var(--text-secondary)]">Drop image or click to upload</span>
              <span className="text-[11.5px] text-[var(--text-muted)] mt-1">JPG, PNG, WEBP up to 10 MB</span>
              <input type="file" accept="image/*" className="hidden" />
            </label>
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-[var(--text-muted)]">
              Image analysis is simulated in this MVP — backend returns AI-generated insights.
            </p>
          </div>
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
              <EmptyState message="Run body analysis to populate skin insights" />
            )}
          </div>
        </div>
      </div>

      {/* ─── Lifestyle Analysis ─── */}
      <SectionTitle>Lifestyle Analysis</SectionTitle>
      <div className="fade-up d3 glass p-6 sm:p-8 mb-10">
        <SectionHeader icon="🌿" title="Lifestyle Analyzer" badge="Holistic View" badgeColor="amber" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">

          {/* Built-in habit toggles */}
          {builtinHabits.map(({ key, label, icon }) => {
            const c = HABIT_COLORS[key] || HABIT_COLORS._default;
            const on = lifestyle[key];
            return (
              <div key={key} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] transition-all duration-150" style={{
                background: on ? c.dim : "var(--bg-surface)",
                border: `1px solid ${on ? c.border : "var(--border)"}`,
              }}>
                <span className="text-[13.5px] font-medium text-[var(--text-primary)] flex items-center gap-2">
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
              <div key={id} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] transition-all duration-150 gap-2" style={{
                background: active ? c.dim : "var(--bg-surface)",
                border: `1px solid ${active ? c.border : "var(--border)"}`,
              }}>
                <span className="text-[13px] font-medium text-[var(--text-primary)] flex-1 flex items-center gap-1.5">
                  <span>🔁</span>
                  <span className="capitalize">{name}</span>
                </span>
                <Toggle
                  checked={active}
                  onChange={() => toggleCustomHabit(id)}
                  color="emerald"
                />
                <button
                  onClick={() => removeCustomHabit(id)}
                  className="bg-transparent border-none text-[var(--text-muted)] hover:text-[var(--red)] cursor-pointer text-sm leading-none p-1 rounded-md transition-colors shrink-0"
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
        <div className="mt-4">
          {showHabitInput ? (
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end w-full">
              <div className="flex-1 min-w-[180px]">
                <FieldLabel>Custom habit name</FieldLabel>
                <input
                  className="field-input w-full mt-1.5"
                  value={newHabitInput}
                  onChange={(e) => { setNewHabitInput(e.target.value); setHabitError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && addCustomHabit()}
                  placeholder="e.g. Caffeine, Gaming, Late Night Snack"
                  autoFocus
                />
                {habitError && <span className="text-[11px] text-[var(--red)] mt-1 block">⚠ {habitError}</span>}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button className="btn btn-violet w-full sm:w-auto justify-center" onClick={addCustomHabit}>Add</button>
                <button className="btn btn-ghost w-full sm:w-auto justify-center" onClick={() => { setShowHabitInput(false); setHabitError(""); }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-ghost border-dashed w-full sm:w-auto justify-center"
              onClick={() => setShowHabitInput(true)}
            >
              + Add Custom Habit
            </button>
          )}
        </div>

        <div className="mt-6">
          <ActionButton onClick={handleRunLifestyle} loading={loading.lifestyle} color="amber">
            {loading.lifestyle ? "Analyzing…" : "Analyze Lifestyle"}
          </ActionButton>
          <div className="mt-4">
            {result.lifestyle ? (
              <ResultBox>{result.lifestyle.insight}</ResultBox>
            ) : (
              <EmptyState message="Configure your lifestyle factors above and run analysis" />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
