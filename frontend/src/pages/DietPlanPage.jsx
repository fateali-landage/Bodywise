import { useState } from "react";
import { PageHeader, SectionTitle, FieldLabel } from "../components/ui";
import RadioGroup from "../components/ui/RadioGroup";

/* ─── BMI helpers ─── */
function calcBMI(weight, height) {
  const h = parseFloat(height) / 100;
  const w = parseFloat(weight);
  if (!h || !w || h <= 0) return null;
  return parseFloat((w / (h * h)).toFixed(1));
}
function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: "Underweight", color: "#0ea5e9" };
  if (bmi < 25)   return { label: "Normal weight", color: "#34d399" };
  if (bmi < 30)   return { label: "Overweight", color: "#fbbf24" };
  return { label: "Obese", color: "#f87171" };
}

/* ─── TDEE helpers ─── */
const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};
function calcTDEE({ age, gender, weight, height, activity }) {
  const w = parseFloat(weight), h = parseFloat(height), a = parseFloat(age);
  if (!w || !h || !a) return null;
  // Mifflin–St Jeor equation
  const bmr = gender === "female"
    ? 10 * w + 6.25 * h - 5 * a - 161
    : 10 * w + 6.25 * h - 5 * a + 5;
  const mult = activityMultipliers[activity] || 1.375;
  const tdee = Math.round(bmr * mult);
  return { maintenance: tdee, loss: tdee - 500, gain: tdee + 300 };
}

/* ─── Meal plan map ─── */
const mealPlans = {
  balanced: ["🥣 Oats + fruits (AM)", "🥗 Chicken salad + brown rice (Lunch)", "🍎 Apple + nuts (Snack)", "🍛 Dal + roti + veggies (Dinner)"],
  vegan:    ["🥤 Green smoothie (AM)", "🥙 Chickpea wrap + salad (Lunch)", "🫐 Berries + seeds (Snack)", "🍲 Lentil curry + quinoa (Dinner)"],
  keto:     ["🍳 Eggs + avocado (AM)", "🥩 Grilled steak + greens (Lunch)", "🧀 Cheese + olives (Snack)", "🐟 Salmon + cauliflower (Dinner)"],
  "high-protein": ["🥚 Egg whites + oats (AM)", "🍗 Chicken breast + sweet potato (Lunch)", "🥛 Protein shake (Snack)", "🥩 Lean beef + broccoli (Dinner)"],
};

const GENDER_OPTS = [{ value: "male", label: "Male", icon: "♂️" }, { value: "female", label: "Female", icon: "♀️" }, { value: "other", label: "Other", icon: "⚧" }];
const ACTIVITY_OPTS = [
  { value: "sedentary",  label: "Sedentary",    icon: "🪑" },
  { value: "light",      label: "Light",         icon: "🚶" },
  { value: "moderate",   label: "Moderate",      icon: "🏃" },
  { value: "active",     label: "Active",        icon: "💪" },
  { value: "veryActive", label: "Very Active",   icon: "🏋️" },
];
const DIET_OPTS = [
  { value: "balanced",     label: "Balanced",     icon: "🥗" },
  { value: "vegan",        label: "Vegan",        icon: "🌱" },
  { value: "keto",         label: "Keto",         icon: "🥩" },
  { value: "high-protein", label: "High Protein", icon: "💪" },
];

export default function DietPlanPage() {
  /* BMI state */
  const [bmiForm, setBmiForm] = useState({ weight: "", height: "" });
  const [bmiResult, setBmiResult] = useState(null);

  /* TDEE state */
  const [tdeeForm, setTdeeForm] = useState({ age: "", gender: "male", weight: "", height: "", activity: "moderate" });
  const [tdeeResult, setTdeeResult] = useState(null);

  /* Diet plan state */
  const [diet, setDiet] = useState("balanced");
  const [showPlan, setShowPlan] = useState(false);

  const handleBMI = () => {
    const bmi = calcBMI(bmiForm.weight, bmiForm.height);
    if (!bmi) return;
    setBmiResult(bmi);
  };

  const handleTDEE = () => {
    const res = calcTDEE(tdeeForm);
    if (!res) return;
    setTdeeResult(res);
  };

  return (
    <>
      <PageHeader
        eyebrow="Nutrition Hub"
        title="Diet Plan"
        description="Calculate your BMI, daily energy needs, and get a personalised meal plan."
      />

      {/* ── BMI Calculator ── */}
      <SectionTitle>BMI Calculator</SectionTitle>
      <div className="fade-up d1 glass" style={{ padding: 28, marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>⚖️</span>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Body Mass Index</span>
          <span className="badge badge-cyan" style={{ marginLeft: "auto" }}>WHO Formula</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div><FieldLabel>Weight (kg)</FieldLabel>
            <input className="field-input" type="number" placeholder="e.g. 70" value={bmiForm.weight}
              onChange={(e) => setBmiForm((p) => ({ ...p, weight: e.target.value }))} />
          </div>
          <div><FieldLabel>Height (cm)</FieldLabel>
            <input className="field-input" type="number" placeholder="e.g. 172" value={bmiForm.height}
              onChange={(e) => setBmiForm((p) => ({ ...p, height: e.target.value }))} />
          </div>
        </div>
        <button className="btn btn-cyan" style={{ marginTop: 0 }} onClick={handleBMI}>Calculate BMI</button>

        {bmiResult && (() => {
          const { label, color } = bmiCategory(bmiResult);
          return (
            <div style={{ marginTop: 20, padding: "20px 24px", borderRadius: "var(--radius-md)", background: `${color}12`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 40, color, lineHeight: 1 }}>{bmiResult}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>BMI</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color }}>{label}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                  Healthy range: 18.5 – 24.9
                </div>
                {label === "Underweight" && <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Consider increasing caloric intake with nutrient-dense foods.</p>}
                {label === "Normal weight" && <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Great! Maintain your current diet and activity level.</p>}
                {label === "Overweight" && <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text-muted)" }}>A 500 kcal daily deficit with exercise can help reach normal range.</p>}
                {label === "Obese" && <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Consult a healthcare professional for a structured weight management plan.</p>}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── TDEE Calculator ── */}
      <SectionTitle>TDEE Calculator</SectionTitle>
      <div className="fade-up d2 glass" style={{ padding: 28, marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>🔥</span>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Total Daily Energy Expenditure</span>
          <span className="badge badge-violet" style={{ marginLeft: "auto" }}>Mifflin–St Jeor</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <FieldLabel>Gender</FieldLabel>
          <div style={{ marginTop: 6 }}>
            <RadioGroup
              options={GENDER_OPTS}
              value={tdeeForm.gender}
              onChange={(v) => setTdeeForm((p) => ({ ...p, gender: v }))}
              color="violet"
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 16 }}>
          {[{ key: "age", label: "Age", placeholder: "e.g. 26" }, { key: "weight", label: "Weight (kg)", placeholder: "e.g. 70" }, { key: "height", label: "Height (cm)", placeholder: "e.g. 172" }].map(({ key, label, placeholder }) => (
            <div key={key}>
              <FieldLabel>{label}</FieldLabel>
              <input className="field-input" type="number" placeholder={placeholder} value={tdeeForm[key]}
                onChange={(e) => setTdeeForm((p) => ({ ...p, [key]: e.target.value }))} />
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <FieldLabel>Activity Level</FieldLabel>
          <div style={{ marginTop: 6 }}>
            <RadioGroup
              options={ACTIVITY_OPTS}
              value={tdeeForm.activity}
              onChange={(v) => setTdeeForm((p) => ({ ...p, activity: v }))}
              color="amber"
            />
          </div>
        </div>

        <button className="btn btn-violet" style={{ marginTop: 0 }} onClick={handleTDEE}>Calculate TDEE</button>

        {tdeeResult && (
          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {[
              { label: "Maintenance", value: tdeeResult.maintenance, color: "#00e5be", icon: "⚖️", sub: "Stay the same" },
              { label: "Weight Loss", value: tdeeResult.loss,        color: "#0ea5e9", icon: "📉", sub: "–500 kcal/day" },
              { label: "Weight Gain", value: tdeeResult.gain,        color: "#a78bfa", icon: "📈", sub: "+300 kcal/day" },
            ].map(({ label, value, color, icon, sub }) => (
              <div key={label} style={{ padding: "18px 16px", borderRadius: "var(--radius-md)", background: `${color}12`, border: `1px solid ${color}28`, textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color, lineHeight: 1 }}>{value.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 2px" }}>kcal / day</div>
                <div style={{ fontWeight: 600, fontSize: 12, color }}>{label}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{sub}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Diet Plan Generator ── */}
      <SectionTitle>Meal Plan Generator</SectionTitle>
      <div className="fade-up d3 glass" style={{ padding: 28, marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>🍽️</span>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Personalised Meal Plan</span>
          <span className="badge badge-emerald" style={{ marginLeft: "auto" }}>AI Suggested</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <FieldLabel>Select your diet type</FieldLabel>
          <div style={{ marginTop: 8 }}>
            <RadioGroup options={DIET_OPTS} value={diet} onChange={setDiet} color="emerald" />
          </div>
        </div>

        <button className="btn btn-emerald" style={{ marginTop: 0 }} onClick={() => setShowPlan(true)}>
          Generate Plan
        </button>

        {showPlan && (
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {(mealPlans[diet] || mealPlans.balanced).map((meal, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--emerald-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "var(--emerald)", flexShrink: 0 }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{meal}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
