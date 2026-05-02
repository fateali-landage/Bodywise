import { useBodyWise } from "../context/BodyWiseContext";
import { supabase } from "../services/supabaseClient";
import { ActionButton, PageHeader, SectionHeader, SectionTitle } from "../components/ui";

export default function ProfilePage() {
  const { user, inputs, lifestyle, result } = useBodyWise();

  // BUG-004/BUG-012 FIX: centralised sign-out with immediate navigate
  const signOut = async () => {
    await supabase.auth.signOut();
    // useAuth's onAuthStateChange fires → user becomes null → ProtectedRoute redirects to /auth
  };

  const profileRows = [
    { label: "Email", value: user?.email || "—" },
    { label: "User ID", value: user?.id || "—" },
    { label: "Last sign-in", value: user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "—" },
    { label: "Created", value: user?.created_at ? new Date(user.created_at).toLocaleString() : "—" },
  ];

  const metricRows = [
    { label: "Weight", value: inputs.weight || "—" },
    { label: "Height", value: inputs.height || "—" },
    { label: "Age", value: inputs.age || "—" },
    { label: "Gender", value: inputs.gender || "—" },
    { label: "Diet", value: inputs.diet || "—" },
    { label: "Activity (days/wk)", value: inputs.activity || "—" },
    { label: "Sleep (hrs)", value: inputs.sleep || "—" },
  ];

  const lifestyleRows = [
    { label: "Smoking", value: lifestyle.smoking ? "Yes" : "No" },
    { label: "Alcohol", value: lifestyle.alcohol ? "Yes" : "No" },
    { label: "Sleep hours", value: lifestyle.sleepHours || "—" },
    { label: "Screen time", value: lifestyle.screenTime || "—" },
  ];

  return (
    <>
      <PageHeader
        title="Profile"
        description="Your account, current metrics and recent activity."
      />

      <SectionTitle>Account</SectionTitle>
      <div className="fade-up d2 glass p-6 sm:p-8 mb-8">
        <SectionHeader icon="👤" title="Account Details" badge="Supabase" badgeColor="cyan" />
        <div className="mt-2">
          {profileRows.map((row) => (
            <div className="stat-row" key={row.label}>
              <span className="text-[var(--text-muted)]">{row.label}</span>
              <span className="font-mono text-[12.5px] text-[var(--text-primary)]">
                {row.value}
              </span>
            </div>
          ))}
        </div>
        <ActionButton onClick={signOut} color="violet" className="mt-4">
          Sign out
        </ActionButton>
      </div>

      <SectionTitle>Body Metrics</SectionTitle>
      <div className="fade-up d3 grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="glass p-5 sm:p-6">
          <SectionHeader icon="📏" title="Current Inputs" badge="Last entered" badgeColor="cyan" />
          <div className="mt-2">
            {metricRows.map((row) => (
              <div className="stat-row" key={row.label}>
                <span className="text-[var(--text-muted)]">{row.label}</span>
                <span className="text-[var(--text-primary)]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-5 sm:p-6">
          <SectionHeader icon="🌿" title="Lifestyle Snapshot" badge="Today" badgeColor="amber" />
          <div className="mt-2">
            {lifestyleRows.map((row) => (
              <div className="stat-row" key={row.label}>
                <span className="text-[var(--text-muted)]">{row.label}</span>
                <span className="text-[var(--text-primary)]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionTitle>Activity</SectionTitle>
      <div className="fade-up d4 glass p-6 sm:p-8">
        <SectionHeader icon="📋" title="Habit Entries" badge="Logged" badgeColor="emerald" />
        <div className="mt-2">
          {result.habits?.length ? (
            <div className="flex flex-col">
              {result.habits.slice(0, 10).map((h) => (
                <div className="stat-row" key={h.id}>
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {h.date}
                  </span>
                  <span className="text-[12.5px] text-[var(--text-primary)]">
                    💧 {h.water ? "✓" : "·"}  😴 {h.sleep ? "✓" : "·"}  🥩 {h.protein ? "✓" : "·"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="m-0 text-[13px] text-[var(--text-muted)]">
              No habit entries yet. Save your first one from the Diet & Calories page.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
