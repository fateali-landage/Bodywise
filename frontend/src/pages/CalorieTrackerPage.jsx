import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getDailyFoodLog, addFoodLog, deleteFoodLog } from "../services/api";
import { PageHeader, SectionTitle, FieldLabel, ActionButton, Spinner, ListSkeleton } from "../components/ui";
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
    <div className="relative w-[140px] h-[140px] flex items-center justify-center shrink-0">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 8px ${color}50)`, transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="text-center relative z-10">
        <div className="font-syne font-extrabold text-2xl leading-none" style={{ color }}>
          {consumed}
        </div>
        <div className="text-[10px] text-[var(--text-muted)] mt-1 tracking-wider uppercase font-mono">of {target} kcal</div>
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
        const { data } = await getDailyFoodLog(todayStr);
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

  // Totals calculation
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

    // Smart parsing helper (e.g. "2 eggs", "150 g chicken breast")
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

    if (!fName) { setError("Please enter a food description."); return; }
    if (isNaN(finalQty) || finalQty <= 0) { setError("Enter a valid quantity greater than zero."); return; }
    
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
      setLog(prev => prev.filter(e => e.id !== id));
      await deleteFoodLog(id);
    } catch (err) {
      console.error(err);
    }
  };

  const getFeedbackMessage = () => {
    if (consumed === 0) return { msg: "Let's log your first meal to sync metrics!", color: "var(--cyan)" };
    if (over > 0) return { msg: `You exceeded daily target by ${over} kcal today.`, color: "var(--red)" };
    if (remaining < 300) return { msg: "You have reached 90% of your energy target.", color: "var(--amber)" };
    if (consumed < DAILY_TARGET * 0.4 && new Date().getHours() > 14) return { msg: "Caloric intake is low for mid-afternoon. Replenish nutrients.", color: "var(--violet)" };
    return { msg: "Caloric balance is optimal. High macro consistency today!", color: "var(--emerald)" };
  };
  const feedback = getFeedbackMessage();

  // Group by meal type
  const groupedLogs = MEAL_OPTS.reduce((acc, opt) => {
    acc[opt.value] = log.filter(l => l.meal_type === opt.value);
    return acc;
  }, {});

  // Mock weekly data for line charts
  const weeklyData = Array.from({length: 6}).map((_, i) => ({
    day: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString("en-US", { weekday: 'short' }),
    kcal: 1900 + Math.round(Math.random() * 600)
  })).concat([{ day: "Today", kcal: consumed }]);

  const CustomChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[12px] shadow-lg">
        <div className="font-syne font-bold mb-1.5 text-[var(--text-primary)]">{label}</div>
        <div className="flex items-center gap-2 text-[var(--text-secondary)] font-medium">
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-[var(--cyan)]" />
          <span>Intake: <strong className="text-[var(--cyan)] font-mono">{payload[0].value} kcal</strong></span>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Energy Management"
        title="Calorie Tracker"
        description="Monitor daily calorie intake, balance metabolic ratios, and review weekly trends."
      />

      {/* Smart Feedback Banner */}
      <div 
        className="fade-up d1 glass py-4 px-5 rounded-xl flex items-center gap-3 border-l-4 hover:border-y-[var(--border)]" 
        style={{ borderLeftColor: feedback.color }}
      >
        <span className="text-xl">💡</span>
        <div className="text-[14px] text-[var(--text-primary)] font-medium">{feedback.msg}</div>
        {protein < 55 && consumed > 500 && (
          <span className="badge badge-amber ml-auto text-[9px]">Low Protein</span>
        )}
      </div>

      {/* Metric Summaries */}
      <div className="fade-up d2 grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: "Target Intake",    value: DAILY_TARGET, color: "var(--cyan)",    icon: "🎯" },
          { label: "Logged Consumed",  value: consumed,      color: "var(--violet)",  icon: "🍽️" },
          { label: "Energy Remaining", value: remaining,     color: over ? "var(--red)" : "var(--emerald)", icon: over ? "⚠️" : "✅" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass p-5 sm:p-6 hover:border-[var(--border-hover)]">
            <div className="flex justify-between items-start mb-3">
              <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">{label}</div>
              <div className="text-lg">{icon}</div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <div className="font-syne font-extrabold text-3xl leading-none" style={{ color }}>{value.toLocaleString()}</div>
              <div className="text-xs text-[var(--text-muted)] font-mono font-semibold">kcal</div>
            </div>
          </div>
        ))}
      </div>

      <div className="fade-up d3 grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Progress & Macros */}
        <div className="glass p-5 sm:p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start h-full hover:border-[var(--border-hover)] justify-between">
          <CalorieRing consumed={consumed} target={DAILY_TARGET} />
          <div className="flex flex-col gap-4 w-full">
            <div className="font-syne font-bold text-[14.5px] text-[var(--text-primary)]">Macronutrient Split</div>
            {[
              { label: "Protein Goal", val: protein, color: "#00e5be", max: 150 },
              { label: "Carbohydrates", val: carbs,   color: "#a78bfa", max: 250 },
              { label: "Fats",          val: fats,    color: "#fbbf24", max: 80 },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-[var(--text-secondary)]">{m.label}</span>
                  <span className="font-mono font-bold" style={{ color: m.color }}>{m.val}g / {m.max}g</span>
                </div>
                <div className="progress-bar-track h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="progress-bar-fill h-full rounded-full" style={{ width: `${Math.min((m.val / m.max) * 100, 100)}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Food Form */}
        <div className="glass p-5 sm:p-6 h-full hover:border-[var(--border-hover)]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">🍳</span>
            <span className="font-syne font-bold text-[14.5px] text-[var(--text-primary)]">Log Meal Entry</span>
          </div>

          {error && <div className="p-3 mb-4 rounded-xl bg-[var(--red-dim)] border border-rgba(248,113,113,0.2) text-[var(--red)] text-xs">⚠️ {error}</div>}

          <div className="mb-4">
            <FieldLabel>Meal Classification</FieldLabel>
            <div className="mt-2">
              <RadioGroup options={MEAL_OPTS} value={mealType} onChange={setMealType} color="cyan" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_100px] gap-3 mb-4">
            <div>
              <FieldLabel>Food Description</FieldLabel>
              <input className="field-input w-full h-11" value={food} onChange={(e) => setFood(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder="e.g. 2 fried eggs, 1 cup of oats" />
            </div>
            <div>
              <FieldLabel>Quantity</FieldLabel>
              <input className="field-input w-full h-11" value={qty} type="number" min="0.1" step="0.5" onChange={(e) => setQty(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
            </div>
            <div>
              <FieldLabel>Unit</FieldLabel>
              <select className="field-input w-full h-11 cursor-pointer" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
            <ActionButton onClick={handleAdd} loading={submitting} color="cyan" className="w-full sm:w-auto h-10 text-xs px-5">
              {submitting ? "Analyzing Nutrition..." : "+ Log Meal"}
            </ActionButton>
            <div className="text-[11px] text-[var(--text-muted)] text-center sm:text-left font-medium">Est. energy & macros sync to scores</div>
          </div>
        </div>
      </div>

      <div className="fade-up d4 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        
        {/* Visual Timeline of Logged Meals */}
        <div className="glass p-5 sm:p-6 hover:border-[var(--border-hover)]">
          <SectionTitle>Today's Log Timeline</SectionTitle>
          
          {loading ? (
            <ListSkeleton />
          ) : log.length === 0 ? (
            <div className="empty-state">
              <span className="text-3xl mb-1">🍽️</span>
              <span className="font-semibold text-sm text-[var(--text-primary)]">Timeline Empty</span>
              <span className="text-xs text-[var(--text-muted)]">No foods have been logged today.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-6 mt-4">
              {MEAL_OPTS.map(meal => {
                const items = groupedLogs[meal.value];
                if (!items || items.length === 0) return null;
                const mealCals = items.reduce((s, i) => s + (i.calories||0), 0);
                
                return (
                  <div key={meal.value} className="relative pl-6 border-l border-[var(--border)] ml-3">
                    {/* Visual marker dot on timeline */}
                    <div className="absolute -left-[6px] top-1.5 w-[11px] h-[11px] rounded-full bg-[var(--cyan)] border-2 border-[var(--bg-base)]" />
                    
                    <div className="flex justify-between items-center mb-3 pb-1 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                        <span>{meal.icon}</span> {meal.label}
                      </div>
                      <span className="text-[12.5px] font-mono font-bold text-[var(--cyan)]">{mealCals} kcal</span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {items.map(entry => (
                        <div key={entry.id} className="flex justify-between items-center p-3 bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border)] rounded-xl transition-all duration-200">
                          <div>
                            <div className="text-[13.5px] font-semibold text-[var(--text-primary)] capitalize">{entry.food_name}</div>
                            <div className="text-[11px] text-[var(--text-muted)] mt-0.5 font-medium">Qty: {entry.quantity} {entry.unit || "serving"} · {new Date(entry.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                          </div>
                          
                          <div className="flex items-center gap-3.5">
                            <div className="text-right">
                              <div className="text-[13px] font-mono font-bold text-[var(--text-primary)]">{entry.calories} kcal</div>
                              <div className="text-[10px] font-mono font-semibold text-[var(--text-muted)] mt-0.5">P:{entry.protein}g C:{entry.carbs}g F:{entry.fats}g</div>
                            </div>
                            <button 
                              onClick={() => handleDelete(entry.id)} 
                              className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer text-sm p-1.5 hover:text-[var(--red)] transition-colors rounded-lg hover:bg-white/5 flex items-center justify-center shrink-0" 
                              aria-label="Delete entry"
                            >
                              ✕
                            </button>
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

        {/* Weekly Calories Intake Curves */}
        <div className="glass p-5 sm:p-6 lg:sticky lg:top-[var(--space-6)] hover:border-[var(--border-hover)]">
          <SectionTitle>Weekly Intake Trend</SectionTitle>
          <div className="w-full h-[320px] min-w-0 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--text-muted)", fontSize: 10.5, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 3200]} tick={{ fill: "var(--text-muted)", fontSize: 10.5, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomChartTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="kcal" 
                  stroke="var(--cyan)" 
                  strokeWidth={3} 
                  dot={{ r: 3, fill: "var(--bg-base)", stroke: "var(--cyan)", strokeWidth: 2 }} 
                  activeDot={{ r: 5 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <div className="text-[10px] text-[var(--text-muted)] mb-2.5 uppercase tracking-wider font-mono font-bold">Quick logging shortcuts</div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
              <button className="btn btn-ghost w-full justify-center text-xs h-9 px-3">Repeat Yesterday's Log</button>
              <button className="btn btn-ghost w-full justify-center text-xs h-9 px-3">Add from Favorites ⭐</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
