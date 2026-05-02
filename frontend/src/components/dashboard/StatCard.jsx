export default function StatCard({ icon, label, value, sub, accent = "#00e5be", trend }) {
  return (
    <div
      className="glass fade-up"
      style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: `${accent}18`,
            border: `1px solid ${accent}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <span
            style={{
              fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
              color: trend >= 0 ? "var(--emerald)" : "var(--red)",
              background: trend >= 0 ? "var(--emerald-dim)" : "var(--red-dim)",
              padding: "3px 8px", borderRadius: 999,
            }}
          >
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div className="stat-number" style={{ color: accent }}>{value}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>
      </div>
      <div className="section-label">{label}</div>
    </div>
  );
}
