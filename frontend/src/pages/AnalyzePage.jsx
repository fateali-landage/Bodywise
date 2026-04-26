import { useNavigate } from "react-router-dom";
import { useBodyWise } from "../context/BodyWiseContext";
import {
  ActionButton,
  EmptyState,
  Field,
  FieldLabel,
  PageHeader,
  ResultBox,
  SectionHeader,
  SectionTitle,
  Toggle,
} from "../components/ui";

const inputFields = [
  { key: "weight", label: "Weight", placeholder: "e.g. 70 kg" },
  { key: "height", label: "Height", placeholder: "e.g. 172 cm" },
  { key: "age", label: "Age", placeholder: "e.g. 26" },
  { key: "gender", label: "Gender", placeholder: "male / female / other" },
  { key: "diet", label: "Diet type", placeholder: "balanced / vegan / keto" },
  { key: "activity", label: "Activity (days/wk)", placeholder: "e.g. 4" },
  { key: "sleep", label: "Sleep (hrs/night)", placeholder: "e.g. 7" },
];

export default function AnalyzePage() {
  const navigate = useNavigate();
  const {
    inputs,
    setInputs,
    lifestyle,
    setLifestyle,
    result,
    runAnalysis,
    runLifestyle,
    loading,
  } = useBodyWise();

  const handleRunBody = async () => {
    await runAnalysis();
    navigate("/results");
  };

  return (
    <>
      <PageHeader
        title="Analyze"
        description="Provide your data — we'll generate body, skin and lifestyle insights."
      />

      <SectionTitle>Body Analysis</SectionTitle>
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

        <div className="glass" style={{ padding: 24 }}>
          <SectionHeader icon="✨" title="Skin Health Analyzer" badge="AI Vision" badgeColor="violet" />
          <FieldLabel>Upload skin photo</FieldLabel>
          <label className="upload-zone">
            <span style={{ fontSize: 32 }}>📸</span>
            <span style={{ fontSize: 13.5, color: "var(--text-secondary)", fontWeight: 500 }}>
              Drop image or click to upload
            </span>
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
                  <span key={d} className="badge badge-violet">
                    {d}
                  </span>
                ))}
              </div>
              <p style={{ margin: 0, color: "var(--text-secondary)" }}>{result.skin.insight}</p>
            </ResultBox>
          ) : (
            <EmptyState message="Run body analysis to populate skin insights" />
          )}
        </div>
      </div>

      <SectionTitle>Lifestyle Analysis</SectionTitle>
      <div className="fade-up d3 glass" style={{ padding: 28, marginBottom: 40 }}>
        <SectionHeader icon="🌿" title="Lifestyle Analyzer" badge="Holistic View" badgeColor="amber" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          {[
            { key: "smoking", label: "Smoking", icon: "🚬" },
            { key: "alcohol", label: "Alcohol", icon: "🍷" },
          ].map(({ key, label, icon }) => (
            <label
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface)",
                border: `1px solid ${lifestyle[key] ? "rgba(248,113,113,0.2)" : "var(--border)"}`,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>{icon}</span>
                {label}
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
        <ActionButton onClick={runLifestyle} loading={loading.lifestyle} color="amber">
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
