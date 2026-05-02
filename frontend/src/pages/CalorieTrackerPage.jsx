import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getDailyFoodLog, addFoodLog, deleteFoodLog } from "../services/api";
import { PageHeader, SectionTitle, FieldLabel, ActionButton, Spinner } from "../components/ui";
import RadioGroup from "../components/ui/RadioGroup";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const DAILY_TARGET = 2400;

function CalorieRing({ consumed, target }) {
  const pct = Math.min((consumed / target) * 100, 100);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct > 95 ? "var(--red)" : pct > 75 ? "var(--amber)" : "var(--cyan)";

  return (
    <div style={{ position: "relative", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 8px ${color}80)`, transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="text-center relative z-10">
        <div className="font-syne font-extrabold text-2xl leading-none" style={{ color }}>
          {consumed}
        </div>
        <div className="text-[10px] text-[var(--text-muted)] mt-1 tracking-wider">of {target}</div>
      </div>
    </div>
  );
}

const MEAL_OPTS = [
  { value: "breakfast", label: "Breakfast", icon: "🍳" },
  { value: "lunch",     label: "Lunch",     icon: "🥗" },
  { value: "dinner",    label: "Dinner",    icon: "🍲" },
  { value: "snack",     label: "Snack",     icon: "🍎" },
];

export default function CalorieTrackerPage() {
  const { user } = useAuth();
  
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [food, setFood] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("serving");
  const [mealType, setMealType] = useState("lunch");

  const UNITS = ["g", "ml", "piece", "serving", "cup", "tbsp"];

  const todayStr = new Date().toISOString().slice(0, 10);

  // Fetch daily log
  useEffect(() => {
    let isMounted = true;
    const fetchLog = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const { data } = await getDailyFoodLog(user.id, todayStr);
        if (isMounted) setLog(data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLog();
    return () => { isMounted = false; };
  }, [user?.id, todayStr]);

  // Totals
  const consumed = log.reduce((sum, item) => sum + (item.calories || 0), 0);
  const remaining = Math.max(DAILY_TARGET - consumed, 0);
  const over = consumed > DAILY_TARGET ? consumed - DAILY_TARGET : 0;
  
  const protein = log.reduce((sum, item) => sum + (item.protein || 0), 0);
  const carbs = log.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const fats = log.reduce((sum, item) => sum + (item.fats || 0), 0);

  const handleAdd = async () => {
    let fName = food.trim();
    let finalQty = parseFloat(qty);
    let finalUnit = unit;

    // Smart parsing: e.g. "2 eggs", "1 cup rice", "150 g chicken"
    const match = fName.match(/^(\d+(?:\.\d+)?)\s*(g|ml|piece|pieces|serving|servings|cup|cups|tbsp)?\s+(.+)$/i);
    if (match) {
      finalQty = parseFloat(match[1]);
      const rawUnit = (match[2] || "").toLowerCase();
      if (rawUnit.startsWith("piece") || rawUnit === "") finalUnit = "piece";
      else if (rawUnit.startsWith("serving")) finalUnit = "serving";
      else if (rawUnit.startsWith("cup")) finalUnit = "cup";
      else if (rawUnit === "g" || rawUnit === "ml" || rawUnit === "tbsp") finalUnit = rawUnit;
      fName = match[3];
    }

    if (!fName) { setError("Please enter a food name."); return; }
    if (isNaN(finalQty) || finalQty <= 0) { setError("Enter a valid quantity."); return; }
    
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        food_name: fName,
        quantity: finalQty,
        unit: finalUnit,
        meal_type: mealType,
        date: todayStr
      };
      const { data } = await addFoodLog(payload);
      if (data?.data) {
        setLog(prev => [data.data, ...prev]);
        setFood("");
        setQty("1");
      }
    } catch (err) {
      setError("Failed to add food. " + (err.message || ""));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      // Optimistic delete
      setLog(prev => prev.filter(e => e.id !== id));
      await deleteFoodLog(id);
    } catch (err) {
      console.error(err);
      // To be robust, we could re-fetch here if it failed
    }
  };

  const getFeedbackMessage = () => {
    if (consumed === 0) return { msg: "Let's log your first meal!", color: "var(--cyan)" };
    if (over > 0) return { msg: `You exceeded by ${over} kcal today.`, color: "var(--red)" };
    if (remaining < 300) return { msg: "You are very close to your goal.", color: "var(--amber)" };
    if (consumed < DAILY_TARGET * 0.4 && new Date().getHours() > 14) return { msg: "You are under-eating today. Time for a snack?", color: "var(--violet)" };
    return { msg: "You are within your calorie goal. Keep it up!", color: "var(--emerald)" };
  };
  const feedback = getFeedbackMessage();

  // Group by meal type
  const groupedLogs = MEAL_OPTS.reduce((acc, opt) => {
    acc[opt.value] = log.filter(l => l.meal_type === opt.value);
    return acc;
  }, {});

  // Mock weekly data for chart, ending with today
  const weeklyData = Array.from({length: 6}).map((_, i) => ({
    day: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString("en-US", { weekday: 'short' }),
    kcal: 1800 + Math.round(Math.random() * 800)
  })).concat([{ day: "Today", kcal: consumed }]);

  return (
    <>
      <PageHeader
        eyebrow="Nutrition Tracker"
        title="Calorie Tracker"
        description="Log meals, track macros, and monitor your daily energy balance."
      />

      {/* ── Summary & Smart Feedback ── */}
      <div className="fade-up d1 glass py-4 px-5 sm:px-6 mb-6 flex items-center gap-3 border-l-4" style={{ borderLeftColor: feedback.color }}>
        <span className="text-xl">💡</span>
        <div className="text-sm text-[var(--text-primary)] font-medium">{feedback.msg}</div>
        {protein < 50 && consumed > 500 && (
          <span className="badge badge-amber ml-auto">Low on Protein</span>
        )}
      </div>

      <div className="fade-up d2 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Target",    value: DAILY_TARGET, color: "var(--cyan)",    icon: "🎯" },
          { label: "Consumed",  value: consumed,      color: "var(--violet)",  icon: "🍽️" },
          { label: "Remaining", value: remaining,     color: over ? "var(--red)" : "var(--emerald)", icon: over ? "⚠️" : "✅" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass p-5 sm:p-6">
            <div className="flex justify-between items-start mb-3">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">{label}</div>
              <div className="text-lg">{icon}</div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <div className="font-syne font-extrabold text-3xl leading-none" style={{ color }}>{value.toLocaleString()}</div>
              <div className="text-xs text-[var(--text-muted)] font-medium">kcal</div>
            </div>
          </div>
        ))}
      </div>

      <div className="fade-up d3 grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        
        {/* Progress & Macros */}
        <div className="glass p-5 sm:p-6 flex flex-col sm:flex-row gap-8 items-center sm:items-start h-full">
          <CalorieRing consumed={consumed} target={DAILY_TARGET} />
          <div className="flex flex-col gap-4 w-full">
            <div className="font-syne font-bold text-base text-[var(--text-primary)]">Macronutrients</div>
            {[
              { label: "Protein", val: protein, color: "#00e5be", max: 150 },
              { label: "Carbs",   val: carbs,   color: "#a78bfa", max: 250 },
              { label: "Fats",    val: fats,    color: "#fbbf24", max: 80 },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--text-secondary)] font-medium">{m.label}</span>
                  <span className="font-mono font-semibold" style={{ color: m.color }}>{m.val}g</span>
                </div>
                <div className="progress-bar-track h-1.5">
                  <div className="progress-bar-fill" style={{ width: `${Math.min((m.val / m.max) * 100, 100)}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Food Form */}
        <div className="glass p-5 sm:p-6 h-full">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">➕</span>
            <span className="font-syne font-bold text-base text-[var(--text-primary)]">Add Food Entry</span>
          </div>

          {error && <div className="p-2.5 mb-3 rounded-[var(--radius-sm)] bg-[var(--red-dim)] border border-[rgba(248,113,113,0.25)] text-[var(--red)] text-xs">⚠ {error}</div>}

          <div className="mb-4">
            <FieldLabel>Meal Type</FieldLabel>
            <div className="mt-1.5">
              <RadioGroup options={MEAL_OPTS} value={mealType} onChange={setMealType} color="cyan" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_100px] gap-2.5 mb-4">
            <div>
              <FieldLabel>Food Name</FieldLabel>
              <input className="field-input w-full" value={food} onChange={(e) => setFood(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder="e.g. 2 eggs, 1 cup rice" />
            </div>
            <div>
              <FieldLabel>Quantity</FieldLabel>
              <input className="field-input w-full" value={qty} type="number" min="0.1" step="0.5" onChange={(e) => setQty(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
            </div>
            <div>
              <FieldLabel>Unit</FieldLabel>
              <select className="field-input w-full cursor-pointer" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <ActionButton onClick={handleAdd} loading={submitting} color="cyan" className="w-full sm:w-auto">
              {submitting ? "Adding..." : "+ Add to Log"}
            </ActionButton>
            <div className="text-[11px] text-[var(--text-muted)] text-center sm:text-left">Auto-estimates kcal & macros</div>
          </div>
        </div>
      </div>

      <div className="fade-up d4 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 mb-10 items-start">
        
        {/* Structured Food Log */}
        <div className="glass p-5 sm:p-6">
          <SectionTitle>Today's Log</SectionTitle>
          {loading ? (
            <div className="flex justify-center p-10"><Spinner /></div>
          ) : log.length === 0 ? (
            <div className="empty-state">No meals logged yet today.</div>
          ) : (
            <div className="flex flex-col gap-6">
              {MEAL_OPTS.map(meal => {
                const items = groupedLogs[meal.value];
                if (!items || items.length === 0) return null;
                const mealCals = items.reduce((s, i) => s + (i.calories||0), 0);
                return (
                  <div key={meal.value}>
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                        <span>{meal.icon}</span> {meal.label}
                      </div>
                      <span className="text-[13px] font-mono font-semibold text-[var(--cyan)]">{mealCals} kcal</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map(entry => (
                        <div key={entry.id} className="flex justify-between items-center p-2 sm:px-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] rounded-[var(--radius-sm)] transition-colors">
                          <div>
                            <div className="text-[13.5px] font-medium text-[var(--text-primary)] capitalize">{entry.food_name}</div>
                            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Qty: {entry.quantity} {entry.unit || "serving"} · {new Date(entry.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="text-right">
                              <div className="text-[13px] font-mono font-semibold text-[var(--text-primary)]">{entry.calories} kcal</div>
                              <div className="text-[10px] text-[var(--text-muted)]">P:{entry.protein} C:{entry.carbs} F:{entry.fats}</div>
                            </div>
                            <button onClick={() => handleDelete(entry.id)} className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer text-base p-1 hover:text-[var(--red)] transition-colors" aria-label="Delete">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weekly Analytics Chart */}
        <div className="glass p-5 sm:p-6 lg:sticky lg:top-6">
          <SectionTitle>Weekly Intake</SectionTitle>
          <div className="h-[220px] mt-4 -ml-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 3000]} tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: 12, color: "var(--text-primary)" }}
                  itemStyle={{ color: "var(--cyan)", fontWeight: 600 }}
                  formatter={(value) => [`${value} kcal`, 'Intake']}
                />
                <Line type="monotone" dataKey="kcal" stroke="var(--cyan)" strokeWidth={3} dot={{ r: 4, fill: "var(--cyan)", strokeWidth: 2, stroke: "var(--bg-base)" }} activeDot={{ r: 6, fill: "var(--cyan)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-5">
            <div className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wider font-semibold">Quick Actions</div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
              <button className="btn btn-ghost w-full justify-center text-xs p-2">Repeat Yesterday's Meals</button>
              <button className="btn btn-ghost w-full justify-center text-xs p-2">Add from Favorites ⭐</button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
