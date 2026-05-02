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
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color, lineHeight: 1 }}>
          {consumed}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, letterSpacing: "0.05em" }}>of {target}</div>
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
  const [mealType, setMealType] = useState("lunch");

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
    if (!food.trim()) { setError("Please enter a food name."); return; }
    if (isNaN(parseFloat(qty)) || parseFloat(qty) <= 0) { setError("Enter a valid quantity."); return; }
    
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        food_name: food.trim(),
        quantity: parseFloat(qty),
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
      <div className="fade-up d1 glass" style={{ padding: "16px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12, borderLeft: `4px solid ${feedback.color}` }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{feedback.msg}</div>
        {protein < 50 && consumed > 500 && (
          <span className="badge badge-amber" style={{ marginLeft: "auto" }}>Low on Protein</span>
        )}
      </div>

      <div className="fade-up d2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 32 }}>
        {[
          { label: "Target",    value: DAILY_TARGET, color: "var(--cyan)",    icon: "🎯" },
          { label: "Consumed",  value: consumed,      color: "var(--violet)",  icon: "🍽️" },
          { label: "Remaining", value: remaining,     color: over ? "var(--red)" : "var(--emerald)", icon: over ? "⚠️" : "✅" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 18 }}>{icon}</div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 32, color, lineHeight: 1 }}>{value.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>kcal</div>
            </div>
          </div>
        ))}
      </div>

      <div className="fade-up d3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 32 }}>
        
        {/* Progress & Macros */}
        <div className="glass" style={{ padding: 24, display: "grid", gridTemplateColumns: "140px 1fr", gap: 32, alignItems: "center" }}>
          <CalorieRing consumed={consumed} target={DAILY_TARGET} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>Macronutrients</div>
            {[
              { label: "Protein", val: protein, color: "#00e5be", max: 150 },
              { label: "Carbs",   val: carbs,   color: "#a78bfa", max: 250 },
              { label: "Fats",    val: fats,    color: "#fbbf24", max: 80 },
            ].map(m => (
              <div key={m.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{m.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", color: m.color, fontWeight: 600 }}>{m.val}g</span>
                </div>
                <div className="progress-bar-track" style={{ height: 6 }}>
                  <div className="progress-bar-fill" style={{ width: `${Math.min((m.val / m.max) * 100, 100)}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Food Form */}
        <div className="glass" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 18 }}>➕</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>Add Food Entry</span>
          </div>

          {error && <div style={{ padding: "8px 12px", marginBottom: 12, borderRadius: "var(--radius-sm)", background: "var(--red-dim)", border: "1px solid rgba(248,113,113,0.25)", color: "var(--red)", fontSize: 12 }}>⚠ {error}</div>}

          <div style={{ marginBottom: 16 }}>
            <FieldLabel>Meal Type</FieldLabel>
            <div style={{ marginTop: 6 }}>
              <RadioGroup options={MEAL_OPTS} value={mealType} onChange={setMealType} color="cyan" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10, marginBottom: 16 }}>
            <div>
              <FieldLabel>Food Name</FieldLabel>
              <input className="field-input" value={food} onChange={(e) => setFood(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder="e.g. 2 eggs, banana" />
            </div>
            <div>
              <FieldLabel>Quantity</FieldLabel>
              <input className="field-input" value={qty} type="number" min="0.1" step="0.5" onChange={(e) => setQty(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <ActionButton onClick={handleAdd} loading={submitting} color="cyan">
              {submitting ? "Adding..." : "+ Add to Log"}
            </ActionButton>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Auto-estimates kcal & macros</div>
          </div>
        </div>
      </div>

      <div className="fade-up d4" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14, marginBottom: 40, alignItems: "start" }}>
        
        {/* Structured Food Log */}
        <div className="glass" style={{ padding: 24 }}>
          <SectionTitle>Today's Log</SectionTitle>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
          ) : log.length === 0 ? (
            <div className="empty-state">No meals logged yet today.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {MEAL_OPTS.map(meal => {
                const items = groupedLogs[meal.value];
                if (!items || items.length === 0) return null;
                const mealCals = items.reduce((s, i) => s + (i.calories||0), 0);
                return (
                  <div key={meal.value}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                        <span>{meal.icon}</span> {meal.label}
                      </div>
                      <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: "var(--cyan)", fontWeight: 600 }}>{mealCals} kcal</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {items.map(entry => (
                        <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="var(--bg-surface-hover)"} onMouseLeave={e => e.currentTarget.style.background="var(--bg-surface)"}>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)", textTransform: "capitalize" }}>{entry.food_name}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Qty: {entry.quantity} · {new Date(entry.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: "var(--text-primary)" }}>{entry.calories} kcal</div>
                              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>P:{entry.protein} C:{entry.carbs} F:{entry.fats}</div>
                            </div>
                            <button onClick={() => handleDelete(entry.id)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, padding: "4px" }} aria-label="Delete">✕</button>
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
        <div className="glass" style={{ padding: 24, position: "sticky", top: 24 }}>
          <SectionTitle>Weekly Intake</SectionTitle>
          <div style={{ height: 220, marginTop: 16, marginLeft: -16 }}>
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
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Quick Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: 12, padding: "8px" }}>Repeat Yesterday's Meals</button>
              <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: 12, padding: "8px" }}>Add from Favorites ⭐</button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
