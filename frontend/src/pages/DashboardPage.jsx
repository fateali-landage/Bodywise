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

export default function DashboardPage({ user }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({});
  const [habitItems, setHabitItems] = useState({ water: true, sleep: false, protein: true });
  const [food, setFood] = useState("grilled chicken salad");
  const [inputs, setInputs] = useState({
    weight: 70,
    height: 172,
    age: 26,
    gender: "female",
    diet: "balanced",
    activity: 4,
    sleep: 7,
  });
  const [lifestyle, setLifestyle] = useState({ smoking: false, alcohol: false, sleepHours: 7, screenTime: 6 });

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

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-5 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-cyan-300">BodyWise AI Dashboard</h1>
          <p className="text-slate-300">Your startup-ready body and skin intelligence MVP</p>
        </div>
        <button className="rounded-lg border border-cyan-300 px-4 py-2 text-cyan-200" onClick={signOut}>
          Sign Out
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Body Score"><ScoreBar label="Body Score" value={scores.bodyScore} /></Card>
        <Card title="Skin Score"><ScoreBar label="Skin Score" value={scores.skinScore} /></Card>
        <Card title="Lifestyle Score"><ScoreBar label="Lifestyle Score" value={scores.lifestyleScore} /></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="AI Body Reaction Analyzer">
          <div className="grid gap-2 md:grid-cols-2">
            {Object.keys(inputs).map((key) => (
              <input
                key={key}
                className="rounded-lg bg-slate-800 p-2"
                value={inputs[key]}
                onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={key}
              />
            ))}
          </div>
          <button className="mt-3 rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-900" onClick={runAnalysis}>
            {loading ? "Analyzing..." : "Run Body + Skin + Prediction"}
          </button>
          {result.body && <p className="mt-3 text-sm">BMI: {result.body.bmi} ({result.body.status}) - {result.body.insight}</p>}
          {result.prediction && <p className="mt-2 text-sm">Future: {result.prediction.weightTrend}, Skin Risk: {result.prediction.skinConditionRisk}</p>}
        </Card>

        <Card title="AI Skin Health Analyzer">
          <input className="w-full rounded-lg bg-slate-800 p-2" type="file" accept="image/*" />
          <p className="mt-2 text-xs text-slate-400">Image upload is UI-only in MVP. Detection is simulated in backend.</p>
          {result.skin && <p className="mt-3 text-sm">Detected: {result.skin.detected.join(", ")} | Suggestion: {result.skin.insight}</p>}
        </Card>

        <Card title="Habit Coach">
          <div className="space-y-2">
            {Object.keys(habitItems).map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={habitItems[item]} onChange={(e) => setHabitItems((prev) => ({ ...prev, [item]: e.target.checked }))} />
                {item}
              </label>
            ))}
          </div>
          <button className="mt-3 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900" onClick={saveHabit}>Save Daily Habits</button>
          <p className="mt-2 text-xs text-slate-300">{result.habits?.length ? `Stored entries: ${result.habits.length}` : "No entries yet."}</p>
        </Card>

        <Card title="Food Intelligence">
          <input className="w-full rounded-lg bg-slate-800 p-2" value={food} onChange={(e) => setFood(e.target.value)} />
          <button className="mt-3 rounded-lg bg-violet-500 px-4 py-2 font-semibold text-slate-900" onClick={runFood}>Analyze Food</button>
          {result.food && <p className="mt-3 text-sm">{result.food.food}: {result.food.estimatedCalories} kcal. {result.food.insight}</p>}
        </Card>

        <Card title="Lifestyle Analyzer">
          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-sm">Smoking <input type="checkbox" checked={lifestyle.smoking} onChange={(e) => setLifestyle((p) => ({ ...p, smoking: e.target.checked }))} /></label>
            <label className="text-sm">Alcohol <input type="checkbox" checked={lifestyle.alcohol} onChange={(e) => setLifestyle((p) => ({ ...p, alcohol: e.target.checked }))} /></label>
            <input className="rounded-lg bg-slate-800 p-2" value={lifestyle.sleepHours} onChange={(e) => setLifestyle((p) => ({ ...p, sleepHours: e.target.value }))} placeholder="sleep hours" />
            <input className="rounded-lg bg-slate-800 p-2" value={lifestyle.screenTime} onChange={(e) => setLifestyle((p) => ({ ...p, screenTime: e.target.value }))} placeholder="screen time" />
          </div>
          <button className="mt-3 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-slate-900" onClick={runLifestyle}>Analyze Lifestyle</button>
          {result.lifestyle && <p className="mt-3 text-sm">{result.lifestyle.insight}</p>}
        </Card>
      </div>
    </div>
  );
}
