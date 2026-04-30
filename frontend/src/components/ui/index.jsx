/**
 * ErrorBanner — Dismissible error alert shown when an API call fails.
 * Receives the error message string and an onDismiss callback.
 */
export const ErrorBanner = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 16px",
        marginBottom: 20,
        borderRadius: "var(--radius-md)",
        background: "rgba(248,113,113,0.08)",
        border: "1px solid rgba(248,113,113,0.25)",
        fontSize: 13,
        color: "var(--red)",
        lineHeight: 1.5,
        animation: "fadeUp 0.3s ease-out both",
      }}
    >
      <span>⚠ {message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            color: "var(--red)",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
            flexShrink: 0,
            padding: "0 2px",
            opacity: 0.7,
          }}
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
    style={{ width: 14, height: 14, animation: "spin 0.8s linear infinite" }}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);


export const FieldLabel = ({ children }) => (
  <span className="section-label" style={{ display: "block", marginBottom: 6 }}>
    {children}
  </span>
);

export const Field = ({ label, ...props }) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    <FieldLabel>{label}</FieldLabel>
    <input className="field-input" {...props} />
  </div>
);

export const ResultBox = ({ children }) =>
  children ? <div className="result-box">{children}</div> : null;

export const EmptyState = ({ message }) => <div className="empty-state">{message}</div>;

// BUG-016 FIX: use a real hidden <input type="checkbox"> so label click
// fires the onChange exactly once — no more double-toggle bug.
export const Toggle = ({ checked, onChange, color = "cyan" }) => (
  <label style={{ display: "inline-flex", cursor: "pointer", position: "relative" }}>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
    />
    <div className={`toggle-track${checked ? ` on-${color}` : ""}`}>
      <div className="toggle-thumb" />
    </div>
  </label>
);


export const ActionButton = ({ onClick, loading, disabled, color = "cyan", children }) => (
  <button
    className={`btn btn-${color}`}
    onClick={onClick}
    disabled={disabled || loading}
  >
    {loading && <Spinner />}
    {children}
  </button>
);

export const SectionHeader = ({ icon, title, badge, badgeColor = "cyan" }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
      >
        {icon}
      </div>
      <span
        className="display"
        style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}
      >
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
    <div
      className="glass"
      style={{
        padding: "28px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        textAlign: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 100,
          height: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
          viewBox="0 0 100 100"
        >
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
        <span style={{ fontSize: 26, zIndex: 1 }}>{icon}</span>
      </div>
      <div>
        <div className="score-ring-value" style={{ color }}>
          {value}
        </div>
        <div className="section-label" style={{ marginTop: 4 }}>
          {label}
        </div>
      </div>
    </div>
  );
};

export const PageHeader = ({ eyebrow, title, description, actions }) => (
  <header className="page-header fade-up">
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div>
        {eyebrow && (
          <span className="badge badge-cyan" style={{ marginBottom: 12 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--cyan)",
                animation: "pulse 1.8s ease-in-out infinite",
              }}
            />
            {eyebrow}
          </span>
        )}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{actions}</div>}
    </div>
  </header>
);

export const SectionTitle = ({ children }) => (
  <div
    className="fade-up"
    style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}
  >
    <span className="section-label">{children}</span>
    <div className="divider" style={{ flex: 1 }} />
  </div>
);
