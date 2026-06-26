import { useBodyWise } from "../context/BodyWiseContext";
import { supabase } from "../services/supabaseClient";
import { ActionButton, PageHeader, SectionHeader, SectionTitle } from "../components/ui";

export default function ProfilePage() {
  const { user, inputs, lifestyle, result } = useBodyWise();

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const profileRows = [
    { label: "Account Email", value: user?.email || "—" },
    { label: "User Session ID", value: user?.id || "—", isMono: true },
    { label: "Last Authentication", value: user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("en-IN") : "—" },
    { label: "Account Registered", value: user?.created_at ? new Date(user.created_at).toLocaleString("en-IN") : "—" },
  ];

  const metricRows = [
    { label: "Weight", value: inputs.weight ? `${inputs.weight} kg` : "—" },
    { label: "Height", value: inputs.height ? `${inputs.height} cm` : "—" },
    { label: "Age", value: inputs.age ? `${inputs.age} yrs` : "—" },
    { label: "Gender Type", value: inputs.gender || "—", capitalize: true },
    { label: "Diet Preference", value: inputs.diet || "—", capitalize: true },
    { label: "Activity Index", value: inputs.activity ? `${inputs.activity} days/wk` : "—" },
    { label: "Sleep Target", value: inputs.sleep ? `${inputs.sleep} hrs` : "—" },
  ];

  const lifestyleRows = [
    { label: "Active Smoking", value: lifestyle.smoking ? "Yes" : "No" },
    { label: "Alcohol Intake", value: lifestyle.alcohol ? "Yes" : "No" },
    { label: "Optimal Sleep", value: lifestyle.sleepHours ? `${lifestyle.sleepHours} hrs` : "—" },
    { label: "Daily Screen Time", value: lifestyle.screenTime ? `${lifestyle.screenTime} hrs` : "—" },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="User Settings"
        description="Review your active credentials, biological metric history, and habit logs sync status."
      />

      {/* Account detail card */}
      <SectionTitle>Account Information</SectionTitle>
      <div className="fade-up d2 glass p-5 sm:p-6 mb-4 hover:border-[var(--border-hover)]">
        <SectionHeader icon="👤" title="Secure Credentials" badge="Supabase active" badgeColor="cyan" />
        <div className="mt-2 flex flex-col">
          {profileRows.map((row) => (
            <div className="stat-row py-3 flex items-center justify-between" key={row.label}>
              <span className="text-[13.5px] text-[var(--text-secondary)] font-medium">{row.label}</span>
              <span className={`text-[13px] text-[var(--text-primary)] font-semibold ${row.isMono ? 'font-mono' : ''}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
        <ActionButton onClick={signOut} color="violet" className="mt-5 h-10 text-xs px-5">
          Sign Out of Account
        </ActionButton>
      </div>

      {/* Biometrics & lifestyle grids */}
      <div className="fade-up d3 grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
        
        {/* Biometrics */}
        <div className="glass p-5 sm:p-6 hover:border-[var(--border-hover)]">
          <SectionHeader icon="📏" title="Biometric Inputs" badge="Latest Scan" badgeColor="cyan" />
          <div className="mt-2 flex flex-col">
            {metricRows.map((row) => (
              <div className="stat-row py-3 flex items-center justify-between" key={row.label}>
                <span className="text-[13.5px] text-[var(--text-secondary)] font-medium">{row.label}</span>
                <span className="text-[13px] text-[var(--text-primary)] font-semibold" style={{ textTransform: row.capitalize ? 'capitalize' : 'none' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lifestyle snapshot */}
        <div className="glass p-5 sm:p-6 hover:border-[var(--border-hover)]">
          <SectionHeader icon="🌿" title="Lifestyle Parameters" badge="Logged Today" badgeColor="amber" />
          <div className="mt-2 flex flex-col">
            {lifestyleRows.map((row) => (
              <div className="stat-row py-3 flex items-center justify-between" key={row.label}>
                <span className="text-[13.5px] text-[var(--text-secondary)] font-medium">{row.label}</span>
                <span className="text-[13px] text-[var(--text-primary)] font-semibold">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Habit log consistency checklist */}
      <SectionTitle>Consistency Tracking</SectionTitle>
      <div className="fade-up d4 glass p-5 sm:p-6 hover:border-[var(--border-hover)]">
        <SectionHeader icon="📋" title="Historical Habits Log" badge="Sync State" badgeColor="emerald" />
        <div className="mt-3">
          {result.habits?.length ? (
            <div className="flex flex-col">
              {result.habits.slice(0, 10).map((h) => (
                <div className="stat-row py-3 flex justify-between items-center" key={h.id}>
                  <span className="font-mono text-xs text-[var(--text-muted)] font-semibold">
                    {new Date(h.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <div className="flex items-center gap-4 text-[12.5px] font-semibold text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1">💧 <strong style={{ color: h.water ? "var(--cyan)" : "var(--text-muted)" }}>{h.water ? "✓" : "·"}</strong></span>
                    <span className="flex items-center gap-1">😴 <strong style={{ color: h.sleep ? "var(--violet)" : "var(--text-muted)" }}>{h.sleep ? "✓" : "·"}</strong></span>
                    <span className="flex items-center gap-1">🥩 <strong style={{ color: h.protein ? "var(--emerald)" : "var(--text-muted)" }}>{h.protein ? "✓" : "·"}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="text-3xl mb-1">📋</span>
              <span className="font-semibold text-sm text-[var(--text-primary)]">Habits History Empty</span>
              <span className="text-xs text-[var(--text-muted)]">Habits logged on calories page will sync and log here.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
