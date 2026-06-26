import { useBodyWise } from "../../context/BodyWiseContext";

const habits = [
  { key: "water",    label: "Water Intake",  icon: "💧", unit: "8 glasses", color: "#0ea5e9", accent: "rgba(14,165,233,0.12)", pct: 87 },
  { key: "protein",  label: "Protein Goal",  icon: "🍗", unit: "1.2g/kg",   color: "#00e5be", accent: "rgba(0,229,190,0.12)", pct: 60 },
  { key: "sleep",    label: "Sleep Quality", icon: "🌙", unit: "7–9 hours",  color: "#a78bfa", accent: "rgba(167,139,250,0.12)", pct: 92 },
];

export default function HabitCard() {
  const { habitItems, setHabitItems, saveHabit } = useBodyWise();

  const toggleHabit = async (key) => {
    const nextValue = !habitItems[key];
    setHabitItems(prev => ({ ...prev, [key]: nextValue }));
    
    // Auto-save to backend with a tiny timeout to let state settle
    try {
      setTimeout(() => saveHabit(), 50);
    } catch (err) {
      console.error("Failed to sync habit", err);
    }
  };

  return (
    <div className="glass p-5 sm:p-6 h-full flex flex-col hover:border-[rgba(255,255,255,0.12)]">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">🎯</span>
        <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">
          Daily Habits
        </span>
        <span className="badge badge-emerald ml-auto text-[10px]">Today</span>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {habits.map(({ key, label, icon, unit, color, accent, pct }) => {
          const checked = habitItems?.[key] ?? false;
          return (
            <div 
              key={key} 
              className="cursor-pointer group select-none p-2.5 rounded-xl border border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-surface-2)] transition-all duration-200"
              onClick={() => toggleHabit(key)}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8.5 h-8.5 rounded-lg flex items-center justify-center text-[15px] transition-transform group-hover:scale-105 duration-200" 
                    style={{ background: accent, border: `1px solid ${color}15` }}
                  >
                    {icon}
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-[var(--text-primary)] transition-colors group-hover:color-[var(--text-primary)]">{label}</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{unit}</div>
                  </div>
                </div>
                
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] transition-all duration-300 active:scale-95" 
                  style={{
                    background: checked ? color : "transparent",
                    border: `1.5px solid ${checked ? color : "var(--border)"}`,
                    color: checked ? "#000000" : "transparent",
                    boxShadow: checked ? `0 0 10px ${color}40` : "none",
                  }}
                >
                  ✓
                </div>
              </div>
              
              <div className="progress-bar-track h-1 rounded-full overflow-hidden bg-[var(--border)]">
                <div
                  className="progress-bar-fill h-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${checked ? pct : 0}%`, 
                    background: `linear-gradient(90deg, ${color}cc, ${color})` 
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-1.5 px-0.5">
                <span className="text-[10px] text-[var(--text-muted)] font-medium">Progress</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: checked ? color : "var(--text-muted)" }}>
                  {checked ? pct : 0}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
