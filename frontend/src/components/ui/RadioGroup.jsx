/**
 * RadioGroup — Pill-button selector for single-choice options.
 * Props:
 *   options: [{ value, label, icon? }]
 *   value: currently selected value
 *   onChange: (value) => void
 *   color: "cyan" | "violet" | "amber" | "emerald"
 */
export default function RadioGroup({ options, value, onChange, color = "cyan" }) {
  const colorMap = {
    cyan:    { active: "var(--cyan)",    dim: "var(--cyan-dim)",    border: "rgba(0,229,190,0.35)",    glow: "rgba(0,229,190,0.25)" },
    violet:  { active: "var(--violet)",  dim: "var(--violet-dim)",  border: "rgba(167,139,250,0.35)",  glow: "rgba(167,139,250,0.25)" },
    amber:   { active: "var(--amber)",   dim: "var(--amber-dim)",   border: "rgba(251,191,36,0.35)",   glow: "rgba(251,191,36,0.25)" },
    emerald: { active: "var(--emerald)", dim: "var(--emerald-dim)", border: "rgba(52,211,153,0.35)",   glow: "rgba(52,211,153,0.25)" },
  };
  const c = colorMap[color] || colorMap.cyan;

  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.value)}
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-full font-syne font-semibold text-[13px] cursor-pointer transition-all duration-200 outline-none hover:-translate-y-[1px]"
            style={{
              border: `1px solid ${isActive ? c.border : "var(--border)"}`,
              background: isActive ? c.dim : "var(--bg-surface)",
              color: isActive ? c.active : "var(--text-secondary)",
              boxShadow: isActive ? `0 0 12px ${c.glow}` : "none",
            }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onChange(opt.value); }}
          >
            {opt.icon && <span className="text-[15px]">{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
