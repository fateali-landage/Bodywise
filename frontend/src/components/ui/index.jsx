/**
 * ErrorBanner — Dismissible error alert shown when an API call fails.
 * Receives the error message string and an onDismiss callback.
 */
export const ErrorBanner = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 p-3 sm:p-4 mb-5 rounded-[var(--radius-md)] text-[13px] leading-relaxed text-[var(--red)] animate-[fadeUp_0.3s_ease-out_both]"
      style={{
        background: "rgba(248,113,113,0.08)",
        border: "1px solid rgba(248,113,113,0.25)",
      }}
    >
      <span>⚠ {message}</span>
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
    className="w-3.5 h-3.5 animate-spin"
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

export const Field = ({ label, ...props }) => (
  <div className="flex flex-col w-full">
    <FieldLabel>{label}</FieldLabel>
    <input className="field-input w-full" {...props} />
  </div>
);

export const ResultBox = ({ children }) =>
  children ? <div className="result-box">{children}</div> : null;

export const EmptyState = ({ message }) => <div className="empty-state">{message}</div>;

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
    {loading && <Spinner />}
    {children}
  </button>
);

export const SectionHeader = ({ icon, title, badge, badgeColor = "cyan" }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-base bg-[rgba(255,255,255,0.06)] border border-[var(--border)]">
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
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 flex-wrap">
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
      {actions && <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">{actions}</div>}
    </div>
  </header>
);

export const SectionTitle = ({ children }) => (
  <div className="fade-up flex items-center gap-2.5 mb-3.5">
    <span className="section-label">{children}</span>
    <div className="divider flex-1" />
  </div>
);
