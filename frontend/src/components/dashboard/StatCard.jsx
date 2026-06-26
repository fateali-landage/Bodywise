export default function StatCard({ icon, label, value, sub, accent = "#00e5be", trend }) {
  const isPositive = trend >= 0;
  
  return (
    <div className="glass fade-up flex flex-col justify-between p-5 sm:p-6 h-full group hover:border-[rgba(255,255,255,0.18)] transition-all">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-transform group-hover:scale-110 duration-200"
            style={{
              background: `${accent}15`,
              border: `1px solid ${accent}25`,
            }}
          >
            {icon}
          </div>
          {trend !== undefined && (
            <span
              className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1"
              style={{
                color: isPositive ? "var(--emerald)" : "var(--red)",
                background: isPositive ? "var(--emerald-dim)" : "var(--red-dim)",
                border: `1px solid ${isPositive ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"}`
              }}
            >
              {isPositive ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          )}
        </div>
        
        <div className="stat-number group-hover:translate-x-1 transition-transform duration-200" style={{ color: accent }}>
          {value}
        </div>
      </div>
      
      <div className="mt-4 border-t border-[var(--border)] pt-3">
        <div className="section-label text-[10px] tracking-wider text-[var(--text-muted)]">{label}</div>
        <div className="text-[12px] text-[var(--text-secondary)] mt-1 font-medium">{sub}</div>
      </div>
    </div>
  );
}
