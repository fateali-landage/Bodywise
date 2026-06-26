import { useState } from "react";
import { PageHeader, SectionTitle, FieldLabel, ActionButton } from "../components/ui";
import RadioGroup from "../components/ui/RadioGroup";

/* ─── BMI helpers ─── */
function calcBMI(weight, height) {
  const h = parseFloat(height) / 100;
  const w = parseFloat(weight);
  if (!h || !w || h <= 0) return null;
  return parseFloat((w / (h * h)).toFixed(1));
}

function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: "Underweight", color: "#0ea5e9", badge: "badge-cyan" };
  if (bmi < 25)   return { label: "Normal weight", color: "#34d399", badge: "badge-emerald" };
  if (bmi < 30)   return { label: "Overweight", color: "#fbbf24", badge: "badge-amber" };
  return { label: "Obese", color: "#f87171", badge: "badge-cyan" }; // fallback cyan or custom red
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
  balanced: [
    { title: "Breakfast Oats", detail: "🥣 Oats + mixed berries + scoop of protein powder (AM)" },
    { title: "Power Lunch", detail: "🥗 Grilled chicken breast + quinoa + avocado salad" },
    { title: "Recovery Snack", detail: "🍎 Apple slices + handful of almonds + green tea" },
    { title: "Nourishing Dinner", detail: "🍛 Dal Tadka + baked salmon or tofu + steamed broccoli" }
  ],
  vegan: [
    { title: "Green Smoothie Bowl", detail: "🥤 Spinach + banana + pea protein + chia seeds (AM)" },
    { title: "Mediterranean Wrap", detail: "🥙 Chickpea hummus wrap + mixed greens salad (Lunch)" },
    { title: "Macro Snack", detail: "🫐 Berries + pumpkin seeds + vegan protein bar" },
    { title: "Lentil Power Bowl", detail: "🍲 Lentil curry + brown rice + baked edamame (Dinner)" }
  ],
  keto: [
    { title: "Keto Morning scramble", detail: "🍳 3 eggs scrambled in grass-fed butter + avocado" },
    { title: "Ribeye & Greens", detail: "🥩 Grilled steak + asparagus cooked in olive oil (Lunch)" },
    { title: "Satiating Snack", detail: "🧀 Cheddar cheese cubes + black olives" },
    { title: "Salmon & Cauli-rice", detail: "🐟 Baked salmon + buttered cauliflower mash (Dinner)" }
  ],
  "high-protein": [
    { title: "Egg White Oats", detail: "🥚 Egg whites stirred into oats + honey + berries (AM)" },
    { title: "Lean Meal Prep", detail: "🍗 Shredded chicken breast + sweet potato + asparagus" },
    { title: "Pro Shake", detail: "🥛 Whey protein shake + scoop of peanut butter" },
    { title: "Lean Beef & Rice", detail: "🥩 Extra lean ground beef + jasmine rice + broccoli (Dinner)" }
  ],
};

const GENDER_OPTS = [
  { value: "male",   label: "Male",   icon: "♂️" },
  { value: "female", label: "Female", icon: "♀️" },
  { value: "other",  label: "Other",  icon: "⚧"  }
];

const ACTIVITY_OPTS = [
  { value: "sedentary",  label: "Sedentary",    icon: "🪑" },
  { value: "light",      label: "Light",         icon: "🚶" },
  { value: "moderate",   label: "Moderate",      icon: "🏃" },
  { value: "active",     label: "Active",        icon: "💪" },
  { value: "veryActive", label: "Very Active",   icon: "🏋️" },
];

const DIET_OPTS = [
  { value: "balanced",     label: "Balanced Plan",     icon: "🥗" },
  { value: "vegan",        label: "Vegan Plan",        icon: "🌱" },
  { value: "keto",         label: "Keto Plan",         icon: "🥩" },
  { value: "high-protein", label: "High Protein",      icon: "💪" },
];

export default function DietPlanPage() {
  /* BMI state */
  const [bmiForm, setBmiForm] = useState({ weight: "", height: "" });
  const [bmiResult, setBmiResult] = useState(null);
  const [bmiError, setBmiError] = useState("");

  /* TDEE state */
  const [tdeeForm, setTdeeForm] = useState({ age: "", gender: "male", weight: "", height: "", activity: "moderate" });
  const [tdeeResult, setTdeeResult] = useState(null);
  const [tdeeError, setTdeeError] = useState("");

  /* Diet plan state */
  const [diet, setDiet] = useState("balanced");
  const [showPlan, setShowPlan] = useState(false);

  const handleBMI = () => {
    const w = parseFloat(bmiForm.weight);
    const h = parseFloat(bmiForm.height);
    if (!w || !h || w < 30 || w > 300 || h < 100 || h > 250) {
      setBmiError("Enter valid weight (30-300kg) and height (100-250cm)");
      return;
    }
    setBmiError("");
    const bmi = calcBMI(bmiForm.weight, bmiForm.height);
    setBmiResult(bmi);
  };

  const handleTDEE = () => {
    const { age, weight, height } = tdeeForm;
    const a = parseFloat(age);
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!a || !w || !h || a < 1 || a > 120 || w < 30 || w > 300 || h < 100 || h > 250) {
      setTdeeError("Please check age (1-120) and biometric inputs.");
      return;
    }
    setTdeeError("");
    const res = calcTDEE(tdeeForm);
    setTdeeResult(res);
  };

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Macro Nutrition"
        title="Diet Planner"
        description="Calculate body parameters, predict daily calorie maintenance thresholds, and review tailored meal timelines."
      />

      {/* ── BMI Calculator ── */}
      <SectionTitle>BMI Calculator</SectionTitle>
      <div className="fade-up d1 glass p-5 sm:p-6 mb-4 hover:border-[var(--border-hover)]">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">⚖️</span>
          <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">Body Mass Index</span>
          <span className="badge badge-cyan ml-auto text-[10px]">WHO Standards</span>
        </div>
        
        {bmiError && <div className="p-3 mb-4 rounded-xl bg-[var(--red-dim)] border border-rgba(248,113,113,0.2) text-[var(--red)] text-xs">⚠️ {bmiError}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="form-group">
            <FieldLabel>Weight (kg)</FieldLabel>
            <input className="field-input mt-1.5" type="number" placeholder="e.g. 70" value={bmiForm.weight}
              onChange={(e) => setBmiForm((p) => ({ ...p, weight: e.target.value }))} />
          </div>
          <div className="form-group">
            <FieldLabel>Height (cm)</FieldLabel>
            <input className="field-input mt-1.5" type="number" placeholder="e.g. 172" value={bmiForm.height}
              onChange={(e) => setBmiForm((p) => ({ ...p, height: e.target.value }))} />
          </div>
        </div>
        <button className="btn btn-cyan w-full sm:w-auto h-10 px-5 text-xs flex justify-center items-center" onClick={handleBMI}>Calculate BMI</button>

        {bmiResult && (() => {
          const { label, color, badge } = bmiCategory(bmiResult);
          return (
            <div className="mt-6 p-5 rounded-xl flex flex-col sm:flex-row items-center sm:items-start gap-5 border" style={{ background: `${color}0b`, borderColor: `${color}20` }}>
              <div className="text-center sm:pr-2">
                <div className="font-syne font-extrabold text-4xl leading-none" style={{ color }}>{bmiResult}</div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1.5 uppercase font-mono tracking-wider">BMI Index</div>
              </div>
              <div className="text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="font-syne font-bold text-lg" style={{ color }}>{label}</span>
                  <span className={`badge ${badge} text-[9px]`}>Official Category</span>
                </div>
                <div className="text-[13px] text-[var(--text-secondary)] mt-1.5 font-medium">
                  Healthy range: 18.5 – 24.9
                </div>
                {label === "Underweight" && <p className="mt-2.5 mb-0 text-xs text-[var(--text-muted)] leading-relaxed">Ensure a steady calorie surplus incorporating nutrient-dense proteins and carbs.</p>}
                {label === "Normal weight" && <p className="mt-2.5 mb-0 text-xs text-[var(--text-muted)] leading-relaxed">Excellent metabolic index. Keep maintaining hydration and energy macros.</p>}
                {label === "Overweight" && <p className="mt-2.5 mb-0 text-xs text-[var(--text-muted)] leading-relaxed">Consider a structured 300-500 kcal daily deficit synced with cardio intervals.</p>}
                {label === "Obese" && <p className="mt-2.5 mb-0 text-xs text-[var(--text-muted)] leading-relaxed">Consult a certified health specialist to design a safe dietary path.</p>}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── TDEE Calculator ── */}
      <SectionTitle>TDEE energy calculator</SectionTitle>
      <div className="fade-up d2 glass p-5 sm:p-6 mb-4 hover:border-[var(--border-hover)]">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">🔥</span>
          <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">Total Daily Energy Expenditure</span>
          <span className="badge badge-violet ml-auto text-[10px]">Mifflin Formula</span>
        </div>

        {tdeeError && <div className="p-3 mb-4 rounded-xl bg-[var(--red-dim)] border border-rgba(248,113,113,0.2) text-[var(--red)] text-xs">⚠️ {tdeeError}</div>}

        <div className="mb-4">
          <FieldLabel>Gender Classification</FieldLabel>
          <div className="mt-2">
            <RadioGroup
              options={GENDER_OPTS}
              value={tdeeForm.gender}
              onChange={(v) => setTdeeForm((p) => ({ ...p, gender: v }))}
              color="violet"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="form-group">
            <FieldLabel>Age</FieldLabel>
            <input className="field-input mt-1.5" type="number" placeholder="e.g. 26" value={tdeeForm.age}
              onChange={(e) => setTdeeForm((p) => ({ ...p, age: e.target.value }))} />
          </div>
          <div className="form-group">
            <FieldLabel>Weight (kg)</FieldLabel>
            <input className="field-input mt-1.5" type="number" placeholder="e.g. 70" value={tdeeForm.weight}
              onChange={(e) => setTdeeForm((p) => ({ ...p, weight: e.target.value }))} />
          </div>
          <div className="form-group">
            <FieldLabel>Height (cm)</FieldLabel>
            <input className="field-input mt-1.5" type="number" placeholder="e.g. 172" value={tdeeForm.height}
              onChange={(e) => setTdeeForm((p) => ({ ...p, height: e.target.value }))} />
          </div>
        </div>

        <div className="mb-4">
          <FieldLabel>Physical Activity Level</FieldLabel>
          <div className="mt-2">
            <RadioGroup
              options={ACTIVITY_OPTS}
              value={tdeeForm.activity}
              onChange={(v) => setTdeeForm((p) => ({ ...p, activity: v }))}
              color="amber"
            />
          </div>
        </div>

        <button className="btn btn-violet w-full sm:w-auto h-10 px-5 text-xs flex justify-center items-center" onClick={handleTDEE}>Calculate Daily Expenditure</button>

        {tdeeResult && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Maintenance", value: tdeeResult.maintenance, color: "var(--cyan)", icon: "⚖️", sub: "Weight homeostasis" },
              { label: "Weight Loss", value: tdeeResult.loss,        color: "var(--violet)", icon: "📉", sub: "–500 kcal/day target" },
              { label: "Weight Gain", value: tdeeResult.gain,        color: "var(--amber)", icon: "📈", sub: "+300 kcal/day target" },
            ].map(({ label, value, color, icon, sub }) => (
              <div key={label} className="p-4.5 rounded-xl text-center border transition-all duration-200 hover:-translate-y-0.5" style={{ background: `${color}0b`, borderColor: `${color}20` }}>
                <div className="text-[20px] mb-2">{icon}</div>
                <div className="font-syne font-extrabold text-xl leading-none" style={{ color }}>{value.toLocaleString()}</div>
                <div className="text-[10px] text-[var(--text-muted)] my-1.5 uppercase font-mono">kcal / day</div>
                <div className="font-bold text-xs" style={{ color }}>{label}</div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Diet Plan Generator ── */}
      <SectionTitle>Dietary Meal Planner</SectionTitle>
      <div className="fade-up d3 glass p-5 sm:p-6 mb-8 hover:border-[var(--border-hover)]">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">🍽️</span>
          <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">Personalised Meal Plan</span>
          <span className="badge badge-emerald ml-auto text-[10px]">AI Generated</span>
        </div>

        <div className="mb-4">
          <FieldLabel>Target Food Structure</FieldLabel>
          <div className="mt-2">
            <RadioGroup options={DIET_OPTS} value={diet} onChange={setDiet} color="emerald" />
          </div>
        </div>

        <button className="btn btn-emerald w-full sm:w-auto h-10 px-5 text-xs flex justify-center items-center" onClick={() => setShowPlan(true)}>
          Generate Daily Plan
        </button>

        {showPlan && (
          <div className="mt-6 flex flex-col gap-3">
            {(mealPlans[diet] || mealPlans.balanced).map((meal, i) => (
              <div key={i} className="flex items-center gap-4 py-3.5 px-4 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)] transition-all duration-150 hover:-translate-y-[0.5px]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold text-[var(--emerald)] shrink-0 bg-[var(--emerald-dim)] border border-[rgba(52,211,153,0.15)]">
                  {i + 1}
                </div>
                <div>
                  <div className="text-[13.5px] font-bold text-[var(--text-primary)]">{meal.title}</div>
                  <div className="text-[12.5px] text-[var(--text-secondary)] mt-0.5">{meal.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
