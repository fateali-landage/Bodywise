export default function StatCard({ icon, label, value, sub, accent = "#00e5be", trend }) {
  return (
    <div className="glass fade-up flex flex-col gap-3.5 p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{
            background: `${accent}18`,
            border: `1px solid ${accent}30`,
          }}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className="text-[11px] font-semibold font-mono px-2 py-0.5 rounded-full"
            style={{
              color: trend >= 0 ? "var(--emerald)" : "var(--red)",
              background: trend >= 0 ? "var(--emerald-dim)" : "var(--red-dim)",
            }}
          >
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-auto">
        <div className="stat-number" style={{ color: accent }}>{value}</div>
        <div className="text-xs text-[var(--text-muted)] mt-1">{sub}</div>
      </div>
      <div className="section-label mt-1">{label}</div>
    </div>
  );
}
