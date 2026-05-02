import { useState, useEffect } from "react";
import { PageHeader, SectionTitle, FieldLabel } from "../components/ui";

const STORAGE_KEY = "bw_calorie_log";
const DAILY_TARGET = 2400;

// Simple calorie estimate map (kcal per 100g or per unit)
const CALORIE_MAP = {
  rice: 130, chicken: 165, egg: 78, milk: 61, banana: 89, apple: 52,
  bread: 265, pasta: 131, oats: 389, yogurt: 59, paneer: 265, dal: 116,
  roti: 120, idli: 39, dosa: 168, burger: 295, pizza: 266, salad: 20,
  coffee: 5, tea: 2, juice: 45, coke: 42, protein: 120, shake: 150,
};

function estimateCalories(food, qty) {
  const key = Object.keys(CALORIE_MAP).find((k) =>
    food.toLowerCase().includes(k)
  );
  const base = key ? CALORIE_MAP[key] : 100; // default 100 kcal
  const multiplier = parseFloat(qty) || 1;
  return Math.round(base * multiplier);
}

function CalorieRing({ consumed, target }) {
  const pct = Math.min((consumed / target) * 100, 100);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct > 90 ? "#f87171" : pct > 70 ? "#fbbf24" : "#00e5be";

  return (
    <div style={{ position: "relative", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)`, transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color, lineHeight: 1 }}>
          {consumed}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>of {target} kcal</div>
      </div>
    </div>
  );
}

export default function CalorieTrackerPage() {
  const [log, setLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [food, setFood] = useState("");
  const [qty, setQty] = useState("1");
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  }, [log]);

  const consumed = log.reduce((sum, item) => sum + item.calories, 0);
  const remaining = Math.max(DAILY_TARGET - consumed, 0);
  const over = consumed > DAILY_TARGET ? consumed - DAILY_TARGET : 0;

  const handleAdd = () => {
    if (!food.trim()) { setError("Please enter a food name."); return; }
    if (isNaN(parseFloat(qty)) || parseFloat(qty) <= 0) { setError("Enter a valid quantity."); return; }
    setError("");
    const calories = estimateCalories(food, qty);
    const entry = {
      id: Date.now(),
      name: food.trim(),
      qty: parseFloat(qty),
      calories,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    setLog((prev) => [entry, ...prev]);
    setFood("");
    setQty("1");
  };

  const handleDelete = (id) => setLog((prev) => prev.filter((e) => e.id !== id));
  const handleClear = () => { if (window.confirm("Clear today's log?")) setLog([]); };

  return (
    <>
      <PageHeader
        eyebrow="Nutrition Tracker"
        title="Calorie Tracker"
        description="Log meals and track your daily calorie intake in real time."
      />

      {/* ── Summary Row ── */}
      <SectionTitle>Today's Overview</SectionTitle>
      <div className="fade-up d1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Target",    value: DAILY_TARGET, color: "var(--cyan)",    icon: "🎯" },
          { label: "Consumed",  value: consumed,      color: "var(--violet)",  icon: "🍽️" },
          { label: "Remaining", value: remaining,     color: over ? "var(--red)" : "var(--emerald)", icon: over ? "⚠️" : "✅" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass" style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color, lineHeight: 1 }}>
              {value.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {label} kcal
            </div>
          </div>
        ))}
      </div>

      {/* ── Progress Ring + Add Food ── */}
      <SectionTitle>Log Food</SectionTitle>
      <div className="fade-up d2" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 14, marginBottom: 32, alignItems: "start" }}>
        {/* Ring */}
        <div className="glass" style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <CalorieRing consumed={consumed} target={DAILY_TARGET} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
              {over > 0 ? `${over} kcal over` : `${remaining} kcal left`}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {Math.round((consumed / DAILY_TARGET) * 100)}% of daily goal
            </div>
          </div>
        </div>

        {/* Input Card */}
        <div className="glass" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 18 }}>➕</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
              Add Food Item
            </span>
          </div>

          {error && (
            <div style={{ padding: "8px 12px", marginBottom: 12, borderRadius: "var(--radius-sm)", background: "var(--red-dim)", border: "1px solid rgba(248,113,113,0.25)", color: "var(--red)", fontSize: 12 }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10, marginBottom: 12 }}>
            <div>
              <FieldLabel>Food name</FieldLabel>
              <input
                className="field-input"
                value={food}
                onChange={(e) => setFood(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="e.g. rice, chicken, banana..."
              />
            </div>
            <div>
              <FieldLabel>Qty / servings</FieldLabel>
              <input
                className="field-input"
                value={qty}
                type="number"
                min="0.1"
                step="0.5"
                onChange={(e) => setQty(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="1"
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <button className="btn btn-cyan" style={{ marginTop: 0 }} onClick={handleAdd}>
              + Add to Log
            </button>
            {log.length > 0 && (
              <button className="btn btn-ghost" style={{ marginTop: 0, fontSize: 12 }} onClick={handleClear}>
                Clear Day
              </button>
            )}
          </div>

          <div style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "var(--cyan-dim)", border: "1px solid rgba(0,229,190,0.12)", fontSize: 12, color: "var(--text-secondary)" }}>
            💡 Calories are estimated automatically from the food name.
          </div>
        </div>
      </div>

      {/* ── Food Log ── */}
      <SectionTitle>Food Log</SectionTitle>
      <div className="fade-up d3 glass" style={{ padding: 24, marginBottom: 40 }}>
        {log.length === 0 ? (
          <div className="empty-state">No food logged yet — add your first meal above!</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {log.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderRadius: "var(--radius-md)",
                  background: "var(--bg-surface)", border: "1px solid var(--border)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 18 }}>🍽️</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)", textTransform: "capitalize" }}>
                      {entry.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      Qty: {entry.qty} · Added at {entry.time}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: "var(--cyan)" }}>
                    {entry.calories} <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>kcal</span>
                  </span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "2px 4px", borderRadius: 6, transition: "color 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    aria-label="Delete entry"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {log.length > 0 && (
          <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--bg-surface-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{log.length} item{log.length !== 1 ? "s" : ""} logged</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: "var(--violet)" }}>
              Total: {consumed.toLocaleString()} kcal
            </span>
          </div>
        )}
      </div>
    </>
  );
}
