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
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }} role="radiogroup">
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.value)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 999,
              border: `1px solid ${isActive ? c.border : "var(--border)"}`,
              background: isActive ? c.dim : "var(--bg-surface)",
              color: isActive ? c.active : "var(--text-secondary)",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.18s",
              boxShadow: isActive ? `0 0 12px ${c.glow}` : "none",
              outline: "none",
            }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onChange(opt.value); }}
          >
            {opt.icon && <span style={{ fontSize: 15 }}>{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
