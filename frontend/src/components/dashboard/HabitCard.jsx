const habits = [
  { key: "water",    label: "Water Intake",  icon: "💧", unit: "8 glasses", color: "#0ea5e9", accent: "rgba(14,165,233,0.15)" },
  { key: "exercise", label: "Exercise",      icon: "🏃", unit: "5 days/wk", color: "#00e5be", accent: "rgba(0,229,190,0.15)" },
  { key: "sleep",    label: "Sleep Quality", icon: "🌙", unit: "7–9 hours",  color: "#a78bfa", accent: "rgba(167,139,250,0.15)" },
];

const progressMap = {
  water: { done: true,  pct: 87 },
  exercise: { done: false, pct: 60 },
  sleep: { done: true,  pct: 92 },
};

export default function HabitCard({ habitItems }) {
  return (
    <div className="glass" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 18 }}>🎯</span>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
          Daily Habits
        </span>
        <span className="badge badge-emerald" style={{ marginLeft: "auto", fontSize: 10 }}>Today</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {habits.map(({ key, label, icon, unit, color, accent }) => {
          const { done, pct } = progressMap[key];
          const checked = habitItems?.[key] ?? done;
          return (
            <div key={key}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, background: accent,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                  }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{unit}</div>
                  </div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: checked ? `${color}22` : "var(--border)",
                  border: `2px solid ${checked ? color : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, color: checked ? color : "var(--text-muted)",
                  transition: "all 0.3s",
                }}>
                  {checked ? "✓" : ""}
                </div>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${checked ? pct : Math.floor(pct * 0.6)}%`, background: `linear-gradient(90deg, ${color}aa, ${color})` }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                <span style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
                  {checked ? pct : Math.floor(pct * 0.6)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
