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
      <div className="fade-up d2 glass" style={{ padding: 28, marginBottom: 30 }}>
        <SectionHeader icon="👤" title="Account Details" badge="Supabase" badgeColor="cyan" />
        <div>
          {profileRows.map((row) => (
            <div className="stat-row" key={row.label}>
              <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
              <span className="mono" style={{ color: "var(--text-primary)", fontSize: 12.5 }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
        <ActionButton onClick={signOut} color="violet">
          Sign out
        </ActionButton>
      </div>

      <SectionTitle>Body Metrics</SectionTitle>
      <div
        className="fade-up d3"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
          marginBottom: 30,
        }}
      >
        <div className="glass" style={{ padding: 24 }}>
          <SectionHeader icon="📏" title="Current Inputs" badge="Last entered" badgeColor="cyan" />
          {metricRows.map((row) => (
            <div className="stat-row" key={row.label}>
              <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
              <span style={{ color: "var(--text-primary)" }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div className="glass" style={{ padding: 24 }}>
          <SectionHeader icon="🌿" title="Lifestyle Snapshot" badge="Today" badgeColor="amber" />
          {lifestyleRows.map((row) => (
            <div className="stat-row" key={row.label}>
              <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
              <span style={{ color: "var(--text-primary)" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <SectionTitle>Activity</SectionTitle>
      <div className="fade-up d4 glass" style={{ padding: 28 }}>
        <SectionHeader icon="📋" title="Habit Entries" badge="Logged" badgeColor="emerald" />
        {result.habits?.length ? (
          <div>
            {result.habits.slice(0, 10).map((h) => (
              <div className="stat-row" key={h.id}>
                <span className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  {h.date}
                </span>
                <span style={{ color: "var(--text-primary)", fontSize: 12.5 }}>
                  💧 {h.water ? "✓" : "·"}  😴 {h.sleep ? "✓" : "·"}  🥩 {h.protein ? "✓" : "·"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
            No habit entries yet. Save your first one from the Diet & Calories page.
          </p>
        )}
      </div>
    </>
  );
}
