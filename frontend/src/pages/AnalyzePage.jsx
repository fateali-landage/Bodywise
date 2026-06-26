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
  ListSkeleton,
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

const HABIT_COLORS = {
  smoking:  { color: "#f87171", dim: "var(--red-dim)", border: "rgba(248,113,113,0.2)" },
  alcohol:  { color: "#fbbf24", dim: "var(--amber-dim)", border: "rgba(251,191,36,0.2)"  },
  _default: { color: "#a78bfa", dim: "var(--violet-dim)", border: "rgba(167,139,250,0.2)" },
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

  /* Simulated drag & drop file upload state */
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);

  /* Realtime field validations */
  const [validationErrors, setValidationErrors] = useState({});

  const validateField = (key, val) => {
    let err = "";
    const num = parseFloat(val);
    if (!val) {
      err = "Field is required";
    } else if (isNaN(num)) {
      err = "Must be a valid number";
    } else {
      if (key === "weight" && (num < 30 || num > 300)) err = "Weight must be 30 – 300 kg";
      if (key === "height" && (num < 100 || num > 250)) err = "Height must be 100 – 250 cm";
      if (key === "age" && (num < 1 || num > 120)) err = "Age must be 1 – 120 yrs";
      if (key === "activity" && (num < 0 || num > 7)) err = "Activity must be 0 – 7 days/wk";
      if (key === "sleep" && (num < 0 || num > 24)) err = "Sleep must be 0 – 24 hrs";
    }

    setValidationErrors((prev) => ({ ...prev, [key]: err }));
    return !err;
  };

  const handleInputChange = (key, val) => {
    setInputs((prev) => ({ ...prev, [key]: val }));
    validateField(key, val);
  };

  const handleRunBody = async () => {
    const { weight, height, age, activity, sleep, gender, diet } = inputs;
    
    // Validate all fields
    const wOk = validateField("weight", weight);
    const hOk = validateField("height", height);
    const aOk = validateField("age", age);
    const actOk = validateField("activity", activity);
    const sOk = validateField("sleep", sleep);

    if (!wOk || !hOk || !aOk || !actOk || !sOk) {
      setError("Please fix validation errors before running analysis.");
      return;
    }

    if (!gender || !diet) {
      setError("Please select gender and diet type before analyzing.");
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
    await runLifestyle(payload);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFileName(file.name);
      simulateFileUpload();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFileName(e.target.files[0].name);
      simulateFileUpload();
    }
  };

  const simulateFileUpload = () => {
    setUploadingFile(true);
    setTimeout(() => {
      setUploadingFile(false);
    }, 1500);
  };

  const builtinHabits = [
    { key: "smoking", label: "Smoking", icon: "🚬" },
    { key: "alcohol", label: "Alcohol", icon: "🍷" },
  ];

  const hasValidationErrors = Object.values(validationErrors).some((v) => !!v);

  return (
    <div className="page-container">
      <ErrorBanner message={error} onDismiss={() => setError(null)} />
      <PageHeader
        title="Analyze Signals"
        description="Provide your biological metrics and lifestyle signals to generate custom predictions."
      />

      {/* ─── Body Analysis ─── */}
      <SectionTitle>Body & Skin Analysis</SectionTitle>
      <div className="fade-up d2 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="glass p-5 sm:p-6 flex flex-col justify-between h-full hover:border-[var(--border-hover)]">
          <div>
            <SectionHeader icon="🫀" title="Body Health Analyzer" badge="BMI + Prediction" badgeColor="cyan" />

            {/* Gender selector */}
            <div className="mb-5 mt-4">
              <FieldLabel>Gender Selection</FieldLabel>
              <div className="mt-2">
                <RadioGroup
                  options={GENDER_OPTS}
                  value={inputs.gender}
                  onChange={(v) => setInputs((p) => ({ ...p, gender: v }))}
                  color="cyan"
                />
              </div>
            </div>

            {/* Diet selector */}
            <div className="mb-5">
              <FieldLabel>Dietary Preference</FieldLabel>
              <div className="mt-2">
                <RadioGroup
                  options={DIET_OPTS}
                  value={inputs.diet}
                  onChange={(v) => setInputs((p) => ({ ...p, diet: v }))}
                  color="violet"
                />
              </div>
            </div>

            {/* Numeric fields with error validation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
              {[
                { key: "weight",   label: "Weight (kg)",     placeholder: "e.g. 70" },
                { key: "height",   label: "Height (cm)",     placeholder: "e.g. 172" },
                { key: "age",      label: "Age",             placeholder: "e.g. 26" },
                { key: "activity", label: "Activity (days/wk)", placeholder: "e.g. 4" },
                { key: "sleep",    label: "Sleep (hrs/night)",  placeholder: "e.g. 7" },
              ].map(({ key, label, placeholder }) => {
                const err = validationErrors[key];
                return (
                  <Field
                    key={key}
                    label={label}
                    value={inputs[key]}
                    placeholder={placeholder}
                    type="number"
                    error={!!err}
                    success={inputs[key] && !err}
                    helperText={err || ""}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <ActionButton 
              onClick={handleRunBody} 
              loading={loading.body} 
              disabled={hasValidationErrors}
              color="cyan" 
              className="w-full mt-4"
            >
              {loading.body ? "Analyzing Body Signals…" : "Run Body + Skin Analysis"}
            </ActionButton>

            <div className="mt-5">
              {loading.body ? (
                <ListSkeleton />
              ) : result.body ? (
                <ResultBox>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="badge badge-cyan mono">BMI {result.body.bmi}</span>
                    <span className="font-semibold text-xs text-[var(--text-primary)]">{result.body.status}</span>
                  </div>
                  <p className="m-0 mb-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">{result.body.insight}</p>
                  {result.prediction && (
                    <div className="pt-3 border-t border-[var(--border)] text-[12.5px] text-[var(--text-muted)] flex flex-wrap gap-x-4 gap-y-1">
                      <span>📈 {result.prediction.weightTrend}</span>
                      <span>🛡️ Skin Risk: {result.prediction.skinConditionRisk}</span>
                    </div>
                  )}
                </ResultBox>
              ) : (
                <EmptyState icon="⚖️" title="No analysis generated yet" message="Run the health analyzer to calculate BMR, BMI, and future wellness predictions." />
              )}
            </div>
          </div>
        </div>

        {/* Skin Analysis */}
        <div className="glass p-5 sm:p-6 flex flex-col justify-between h-full hover:border-[var(--border-hover)]">
          <div>
            <SectionHeader icon="✨" title="Skin Health Vision AI" badge="AI Scanner" badgeColor="violet" />
            <div className="mt-4">
              <FieldLabel>Upload skin photograph</FieldLabel>
              
              <label 
                className={`upload-zone mt-2 ${dragActive ? "drag-active border-[var(--violet)] bg-[var(--violet-dim)]" : ""}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                {uploadingFile ? (
                  <div className="flex flex-col items-center py-4">
                    <span className="text-3xl animate-bounce mb-3">📸</span>
                    <span className="text-[13.5px] font-semibold text-[var(--violet)]">Uploading and scan active...</span>
                  </div>
                ) : uploadedFileName ? (
                  <div className="flex flex-col items-center py-4">
                    <span className="text-3xl mb-3">✔️</span>
                    <span className="text-[13.5px] font-semibold text-[var(--emerald)]">{uploadedFileName}</span>
                    <span className="text-[11px] text-[var(--text-muted)] mt-1">File scanned successfully</span>
                  </div>
                ) : (
                  <>
                    <span className="text-3xl mb-2 transition-transform group-hover:scale-110">📸</span>
                    <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">Drop image here or click to browse</span>
                    <span className="text-[11.5px] text-[var(--text-muted)] mt-1">Supports JPG, PNG up to 10 MB</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
              
              <p className="mt-3 text-[11.5px] leading-relaxed text-[var(--text-muted)]">
                Dermatology scanner uses simulated vision networks. Your data remains local and secure.
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            {loading.body ? (
              <ListSkeleton />
            ) : result.skin ? (
              <ResultBox>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {result.skin.detected.map((d) => (
                    <span key={d} className="badge badge-violet text-[10px]">{d}</span>
                  ))}
                </div>
                <p className="m-0 text-[13px] leading-relaxed text-[var(--text-secondary)]">{result.skin.insight}</p>
              </ResultBox>
            ) : (
              <EmptyState icon="📸" title="Scan pending" message="Your skin analysis results will automatically populate once body metrics are ran." />
            )}
          </div>
        </div>
      </div>

      {/* ─── Lifestyle Analysis ─── */}
      <SectionTitle>Lifestyle & Habit analysis</SectionTitle>
      <div className="fade-up d3 glass p-5 sm:p-6 mb-8 hover:border-[var(--border-hover)]">
        <SectionHeader icon="🌿" title="Habit & Recovery Analyzer" badge="Holistic" badgeColor="amber" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">

          {/* Built-in habit toggles */}
          {builtinHabits.map(({ key, label, icon }) => {
            const c = HABIT_COLORS[key] || HABIT_COLORS._default;
            const on = lifestyle[key];
            return (
              <div key={key} className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-200" style={{
                background: on ? c.dim : "rgba(255,255,255,0.015)",
                border: `1.5px solid ${on ? c.color : "var(--border)"}`,
              }}>
                <span className="text-[13.5px] font-semibold text-[var(--text-primary)] flex items-center gap-2.5">
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
              <div key={id} className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 gap-2" style={{
                background: active ? c.dim : "rgba(255,255,255,0.015)",
                border: `1.5px solid ${active ? c.color : "var(--border)"}`,
              }}>
                <span className="text-[13.5px] font-semibold text-[var(--text-primary)] flex-1 flex items-center gap-2">
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
                  className="bg-transparent border-none text-[var(--text-muted)] hover:text-[var(--red)] cursor-pointer text-sm leading-none p-1 rounded transition-colors shrink-0"
                  aria-label="Remove habit"
                >✕</button>
              </div>
            );
          })}

          <Field
            label="Sleep Hours/Night"
            value={lifestyle.sleepHours}
            placeholder="e.g. 7"
            type="number"
            onChange={(e) => setLifestyle((p) => ({ ...p, sleepHours: e.target.value }))}
          />
          <Field
            label="Screen Time (hrs/day)"
            value={lifestyle.screenTime}
            placeholder="e.g. 6"
            type="number"
            onChange={(e) => setLifestyle((p) => ({ ...p, screenTime: e.target.value }))}
          />
        </div>

        {/* Add Custom Habit */}
        <div className="mt-5">
          {showHabitInput ? (
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end w-full p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)]">
              <div className="flex-1">
                <FieldLabel>Habit Label</FieldLabel>
                <input
                  className="field-input w-full mt-1.5"
                  value={newHabitInput}
                  onChange={(e) => { setNewHabitInput(e.target.value); setHabitError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && addCustomHabit()}
                  placeholder="e.g. Caffeine, Late Night Snack"
                  autoFocus
                />
                {habitError && <span className="text-[11px] text-[var(--red)] mt-1 block">⚠️ {habitError}</span>}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button className="btn btn-violet w-full sm:w-auto text-xs" onClick={addCustomHabit}>Add Habit</button>
                <button className="btn btn-ghost w-full sm:w-auto text-xs" onClick={() => { setShowHabitInput(false); setHabitError(""); }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-ghost border-dashed w-full sm:w-auto justify-center text-xs h-10"
              onClick={() => setShowHabitInput(true)}
            >
              + Add Custom Habit Track
            </button>
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-[var(--border)]">
          <ActionButton onClick={handleRunLifestyle} loading={loading.lifestyle} color="amber" className="w-full sm:w-auto">
            {loading.lifestyle ? "Running Lifestyle Analysis…" : "Run Lifestyle Analysis"}
          </ActionButton>
          
          <div className="mt-5">
            {loading.lifestyle ? (
              <ListSkeleton />
            ) : result.lifestyle ? (
              <ResultBox>
                <div className="mb-2">
                  <span className="badge badge-amber text-[10px]">Score {result.lifestyle.lifestyleScore}</span>
                </div>
                <p className="m-0 text-[13.5px] leading-relaxed text-[var(--text-secondary)]">{result.lifestyle.insight}</p>
              </ResultBox>
            ) : (
              <EmptyState icon="🌿" title="Analysis pending" message="Configure your habits and variables above to fetch holistic health and sleep efficiency scores." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
