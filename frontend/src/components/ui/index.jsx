import { Link } from "react-router-dom";

/**
 * ErrorBanner — Dismissible error alert shown when an API call fails.
 * Receives the error message string and an onDismiss callback.
 */
export const ErrorBanner = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 p-4 mb-5 rounded-[var(--radius-md)] text-[13px] leading-relaxed text-[var(--red)] animate-[fadeUp_0.3s_ease-out_both]"
      style={{
        background: "var(--red-dim)",
        border: "1px solid rgba(248,113,113,0.2)",
      }}
    >
      <span className="flex items-center gap-2">⚠️ {message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="bg-transparent border-none text-[var(--red)] cursor-pointer text-base leading-none shrink-0 px-0.5 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
};

export const Spinner = () => (
  <svg
    className="w-4 h-4 animate-spin text-current"
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const FieldLabel = ({ children }) => (
  <span className="section-label block mb-1.5">
    {children}
  </span>
);

export const Field = ({ label, error, success, helperText, ...props }) => (
  <div className="form-group w-full">
    {label && <FieldLabel>{label}</FieldLabel>}
    <input
      className={`field-input w-full ${error ? "field-input-error" : ""} ${success ? "field-input-success" : ""}`}
      {...props}
    />
    {helperText && (
      <span className={`field-helper-text ${error ? "error" : ""} ${success ? "success" : ""}`}>
        {helperText}
      </span>
    )}
  </div>
);

export const ResultBox = ({ children }) =>
  children ? <div className="result-box">{children}</div> : null;

export const EmptyState = ({ icon = "📊", title = "No data yet", message, action }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon}</div>
    <div className="empty-state-title">{title}</div>
    {message && <div className="empty-state-desc">{message}</div>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

// BUG-016 FIX: use a real hidden <input type="checkbox"> so label click
// fires the onChange exactly once — no more double-toggle bug.
export const Toggle = ({ checked, onChange, color = "cyan" }) => (
  <label className="inline-flex cursor-pointer relative">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="absolute opacity-0 w-0 h-0"
    />
    <div className={`toggle-track${checked ? ` on-${color}` : ""}`}>
      <div className="toggle-thumb" />
    </div>
  </label>
);

export const ActionButton = ({ onClick, loading, disabled, color = "cyan", children, className = "" }) => (
  <button
    className={`btn btn-${color} w-full sm:w-auto justify-center ${className}`}
    onClick={onClick}
    disabled={disabled || loading}
  >
    {loading ? <Spinner /> : children}
  </button>
);

export const SectionHeader = ({ icon, title, badge, badgeColor = "cyan" }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-base bg-[rgba(255,255,255,0.04)] border border-[var(--border)]">
        {icon}
      </div>
      <span className="font-syne text-[15px] font-semibold text-[var(--text-primary)]">
        {title}
      </span>
    </div>
    {badge && <span className={`badge badge-${badgeColor}`}>{badge}</span>}
  </div>
);

export const ScoreRing = ({ value, label, icon, color, trackColor, glowColor }) => {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;

  return (
    <div className="glass p-5 sm:p-7 flex flex-col items-center gap-4 text-center h-full justify-center">
      <div className="relative w-[100px] h-[100px] flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke={trackColor} strokeWidth="7" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{
              filter: `drop-shadow(0 0 8px ${glowColor})`,
              transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </svg>
        <span className="text-[26px] relative z-10">{icon}</span>
      </div>
      <div>
        <div className="score-ring-value" style={{ color }}>
          {value}
        </div>
        <div className="section-label mt-1">
          {label}
        </div>
      </div>
    </div>
  );
};

export const PageHeader = ({ eyebrow, title, description, actions }) => (
  <header className="page-header fade-up">
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 flex-wrap">
      <div className="flex-1">
        {eyebrow && (
          <span className="badge badge-cyan mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-[pulse_1.8s_ease-in-out_infinite]" />
            {eyebrow}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold">{title}</h1>
        {description && <p className="mt-2 text-sm text-[var(--text-muted)] max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto mt-2 md:mt-0">{actions}</div>}
    </div>
  </header>
);

export const SectionTitle = ({ children }) => (
  <div className="fade-up flex items-center gap-2.5 mb-4 mt-6">
    <span className="section-label">{children}</span>
    <div className="divider flex-1" />
  </div>
);

/* ─── Premium Skeleton Loader Components ─── */

export const CardSkeleton = () => (
  <div className="glass p-5 sm:p-6 flex flex-col gap-4 h-full">
    <div className="flex items-center justify-between">
      <div className="skeleton w-10 h-10 rounded-xl" />
      <div className="skeleton w-12 h-5 rounded-full" />
    </div>
    <div className="mt-auto flex flex-col gap-2">
      <div className="skeleton h-8 w-2/3" />
      <div className="skeleton h-4 w-1/2" />
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="glass p-5 sm:p-6 flex flex-col gap-4 w-full h-[360px]">
    <div className="flex items-center gap-2">
      <div className="skeleton w-5 h-5 rounded" />
      <div className="skeleton w-32 h-5 rounded" />
    </div>
    <div className="flex-1 skeleton w-full rounded-lg mt-2" />
  </div>
);

export const ScoreSkeleton = () => (
  <div className="glass p-6 sm:p-8 flex flex-col items-center gap-4 text-center h-full justify-center">
    <div className="skeleton w-[100px] h-[100px] rounded-full" />
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="skeleton h-8 w-16" />
      <div className="skeleton h-3 w-24" />
    </div>
  </div>
);

export const ListSkeleton = () => (
  <div className="flex flex-col gap-3 w-full">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex justify-between items-center p-3 glass rounded-[var(--radius-sm)]">
        <div className="flex flex-col gap-2 w-2/3">
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-3 w-2/3" />
        </div>
        <div className="skeleton h-6 w-16 rounded-md" />
      </div>
    ))}
  </div>
);
