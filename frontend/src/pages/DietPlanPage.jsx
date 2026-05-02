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
      <div className="fade-up d1 glass p-6 sm:p-8 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">⚖️</span>
          <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">Body Mass Index</span>
          <span className="badge badge-cyan ml-auto">WHO Formula</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div><FieldLabel>Weight (kg)</FieldLabel>
            <input className="field-input w-full mt-1.5" type="number" placeholder="e.g. 70" value={bmiForm.weight}
              onChange={(e) => setBmiForm((p) => ({ ...p, weight: e.target.value }))} />
          </div>
          <div><FieldLabel>Height (cm)</FieldLabel>
            <input className="field-input w-full mt-1.5" type="number" placeholder="e.g. 172" value={bmiForm.height}
              onChange={(e) => setBmiForm((p) => ({ ...p, height: e.target.value }))} />
          </div>
        </div>
        <button className="btn btn-cyan w-full sm:w-auto mt-0 justify-center" onClick={handleBMI}>Calculate BMI</button>

        {bmiResult && (() => {
          const { label, color } = bmiCategory(bmiResult);
          return (
            <div className="mt-5 p-5 sm:px-6 rounded-[var(--radius-md)] flex flex-col sm:flex-row items-center sm:items-start gap-6 border" style={{ background: `${color}12`, borderColor: `${color}30` }}>
              <div className="text-center">
                <div className="font-syne font-extrabold text-[40px] leading-none" style={{ color }}>{bmiResult}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">BMI</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="font-syne font-bold text-lg" style={{ color }}>{label}</div>
                <div className="text-[13px] text-[var(--text-secondary)] mt-1">
                  Healthy range: 18.5 – 24.9
                </div>
                {label === "Underweight" && <p className="mt-2 mb-0 text-xs text-[var(--text-muted)]">Consider increasing caloric intake with nutrient-dense foods.</p>}
                {label === "Normal weight" && <p className="mt-2 mb-0 text-xs text-[var(--text-muted)]">Great! Maintain your current diet and activity level.</p>}
                {label === "Overweight" && <p className="mt-2 mb-0 text-xs text-[var(--text-muted)]">A 500 kcal daily deficit with exercise can help reach normal range.</p>}
                {label === "Obese" && <p className="mt-2 mb-0 text-xs text-[var(--text-muted)]">Consult a healthcare professional for a structured weight management plan.</p>}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── TDEE Calculator ── */}
      <SectionTitle>TDEE Calculator</SectionTitle>
      <div className="fade-up d2 glass p-6 sm:p-8 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">🔥</span>
          <span className="font-syne font-bold text-[15px] text-[var(--text-primary)] hidden sm:inline">Total Daily Energy Expenditure</span>
          <span className="font-syne font-bold text-[15px] text-[var(--text-primary)] sm:hidden">TDEE</span>
          <span className="badge badge-violet ml-auto">Mifflin–St Jeor</span>
        </div>

        <div className="mb-4">
          <FieldLabel>Gender</FieldLabel>
          <div className="mt-1.5">
            <RadioGroup
              options={GENDER_OPTS}
              value={tdeeForm.gender}
              onChange={(v) => setTdeeForm((p) => ({ ...p, gender: v }))}
              color="violet"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {[{ key: "age", label: "Age", placeholder: "e.g. 26" }, { key: "weight", label: "Weight (kg)", placeholder: "e.g. 70" }, { key: "height", label: "Height (cm)", placeholder: "e.g. 172" }].map(({ key, label, placeholder }) => (
            <div key={key}>
              <FieldLabel>{label}</FieldLabel>
              <input className="field-input w-full mt-1.5" type="number" placeholder={placeholder} value={tdeeForm[key]}
                onChange={(e) => setTdeeForm((p) => ({ ...p, [key]: e.target.value }))} />
            </div>
          ))}
        </div>

        <div className="mb-4">
          <FieldLabel>Activity Level</FieldLabel>
          <div className="mt-1.5">
            <RadioGroup
              options={ACTIVITY_OPTS}
              value={tdeeForm.activity}
              onChange={(v) => setTdeeForm((p) => ({ ...p, activity: v }))}
              color="amber"
            />
          </div>
        </div>

        <button className="btn btn-violet w-full sm:w-auto mt-0 justify-center" onClick={handleTDEE}>Calculate TDEE</button>

        {tdeeResult && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Maintenance", value: tdeeResult.maintenance, color: "#00e5be", icon: "⚖️", sub: "Stay the same" },
              { label: "Weight Loss", value: tdeeResult.loss,        color: "#0ea5e9", icon: "📉", sub: "–500 kcal/day" },
              { label: "Weight Gain", value: tdeeResult.gain,        color: "#a78bfa", icon: "📈", sub: "+300 kcal/day" },
            ].map(({ label, value, color, icon, sub }) => (
              <div key={label} className="py-[18px] px-4 rounded-[var(--radius-md)] text-center border" style={{ background: `${color}12`, borderColor: `${color}28` }}>
                <div className="text-[22px] mb-1.5">{icon}</div>
                <div className="font-syne font-extrabold text-[22px] leading-none" style={{ color }}>{value.toLocaleString()}</div>
                <div className="text-[11px] text-[var(--text-muted)] my-1">kcal / day</div>
                <div className="font-semibold text-xs" style={{ color }}>{label}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{sub}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Diet Plan Generator ── */}
      <SectionTitle>Meal Plan Generator</SectionTitle>
      <div className="fade-up d3 glass p-6 sm:p-8 mb-10">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">🍽️</span>
          <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">Personalised Meal Plan</span>
          <span className="badge badge-emerald ml-auto">AI Suggested</span>
        </div>

        <div className="mb-4">
          <FieldLabel>Select your diet type</FieldLabel>
          <div className="mt-2">
            <RadioGroup options={DIET_OPTS} value={diet} onChange={setDiet} color="emerald" />
          </div>
        </div>

        <button className="btn btn-emerald w-full sm:w-auto mt-0 justify-center" onClick={() => setShowPlan(true)}>
          Generate Plan
        </button>

        {showPlan && (
          <div className="mt-5 flex flex-col gap-2.5">
            {(mealPlans[diet] || mealPlans.balanced).map((meal, i) => (
              <div key={i} className="flex items-center gap-3.5 py-3.5 px-[18px] rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)]">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold text-[var(--emerald)] shrink-0 bg-[var(--emerald-dim)]">
                  {i + 1}
                </div>
                <span className="text-sm text-[var(--text-secondary)]">{meal}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
