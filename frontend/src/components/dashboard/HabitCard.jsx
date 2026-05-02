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
    <div className="glass p-4 sm:p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">🎯</span>
        <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">
          Daily Habits
        </span>
        <span className="badge badge-emerald ml-auto text-[10px]">Today</span>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {habits.map(({ key, label, icon, unit, color, accent }) => {
          const { done, pct } = progressMap[key];
          const checked = habitItems?.[key] ?? done;
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[15px]" style={{ background: accent }}>
                    {icon}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--text-primary)]">{label}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">{unit}</div>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] transition-all duration-300" style={{
                  background: checked ? `${color}22` : "var(--border)",
                  border: `2px solid ${checked ? color : "var(--border)"}`,
                  color: checked ? color : "var(--text-muted)",
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
              <div className="flex justify-end mt-1">
                <span className="text-[10px] font-mono font-semibold" style={{ color }}>
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
