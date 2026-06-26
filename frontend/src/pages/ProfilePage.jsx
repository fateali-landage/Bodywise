import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useBodyWise } from "../context/BodyWiseContext";
import { supabase } from "../services/supabaseClient";
import { ActionButton, PageHeader, SectionHeader, SectionTitle, FieldLabel } from "../components/ui";
import { getActiveGoal, updateGoalTargets, resetGoal } from "../services/api";

export default function ProfilePage() {
  const { user, inputs, lifestyle, result } = useBodyWise();

  // PWA and network states
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swActive, setSwActive] = useState(false);

  // Goal & Macro manual targets states
  const [goal, setGoal] = useState(null);
  const [loadingGoal, setLoadingGoal] = useState(true);
  const [submittingGoal, setSubmittingGoal] = useState(false);
  const [goalSuccess, setGoalSuccess] = useState("");
  const [goalError, setGoalError] = useState("");

  const [editTargetWeight, setEditTargetWeight] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editActivity, setEditActivity] = useState("");
  const [editCalories, setEditCalories] = useState("");
  const [editProtein, setEditProtein] = useState("");
  const [editCarbs, setEditCarbs] = useState("");
  const [editFat, setEditFat] = useState("");
  const [editWater, setEditWater] = useState("");

  const fetchGoal = async () => {
    if (!user?.id) return;
    try {
      setLoadingGoal(true);
      const res = await getActiveGoal();
      if (res?.data?.success && res?.data?.data) {
        setGoal(res.data.data);
        setEditTargetWeight(String(res.data.target_weight));
        setEditTargetDate(res.data.target_date || "");
        setEditActivity(res.data.activity_level);
        setEditCalories(String(res.data.daily_calorie_goal));
        setEditProtein(String(res.data.protein_goal));
        setEditCarbs(String(res.data.carbs_goal));
        setEditFat(String(res.data.fat_goal));
        setEditWater(String(res.data.water_goal));
      } else {
        setGoal(null);
      }
    } catch (e) {
      console.error("Failed to load goal inside profile settings:", e);
    } finally {
      setLoadingGoal(false);
    }
  };

  useEffect(() => {
    fetchGoal();
  }, [user?.id]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    if ("serviceWorker" in navigator) {
      setSwActive(!!navigator.serviceWorker.controller);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const handleUpdateGoalTargets = async () => {
    setGoalError("");
    setGoalSuccess("");

    const targetWNum = parseFloat(editTargetWeight);
    const calVal = parseInt(editCalories, 10);
    const protVal = parseInt(editProtein, 10);
    const carbVal = parseInt(editCarbs, 10);
    const fatVal = parseInt(editFat, 10);
    const waterVal = parseInt(editWater, 10);

    if (isNaN(targetWNum) || targetWNum <= 0 || isNaN(calVal) || calVal < 0 || isNaN(protVal) || protVal < 0 || isNaN(carbVal) || carbVal < 0 || isNaN(fatVal) || fatVal < 0 || isNaN(waterVal) || waterVal < 0) {
      setGoalError("Please enter valid, non-negative numbers for all numeric fields.");
      return;
    }

    setSubmittingGoal(true);
    try {
      const payload = {
        target_weight: targetWNum,
        target_date: editTargetDate || null,
        activity_level: editActivity,
        daily_calorie_goal: calVal,
        protein_goal: protVal,
        carbs_goal: carbVal,
        fat_goal: fatVal,
        water_goal: waterVal
      };

      const res = await updateGoalTargets(payload);
      if (res?.data?.success) {
        setGoalSuccess("Goal settings and daily targets saved successfully.");
        fetchGoal();
      }
    } catch (err) {
      console.error(err);
      setGoalError(err.message || "Failed to update target configurations.");
    } finally {
      setSubmittingGoal(false);
    }
  };

  const handleToggleGoalStatus = async () => {
    if (!goal) return;
    setGoalError("");
    setGoalSuccess("");
    setSubmittingGoal(true);
    try {
      const newStatus = goal.status === "paused" ? "active" : "paused";
      const res = await updateGoalTargets({ status: newStatus });
      if (res?.data?.success) {
        setGoalSuccess(`Goal targets ${newStatus === "paused" ? "paused" : "resumed"} successfully.`);
        fetchGoal();
      }
    } catch (err) {
      console.error(err);
      setGoalError("Failed to update goal status.");
    } finally {
      setSubmittingGoal(false);
    }
  };

  const handleResetGoal = async () => {
    if (!window.confirm("Are you sure you want to reset your goal? This will clear all target weights, calories, and macros.")) return;
    setGoalError("");
    setGoalSuccess("");
    setSubmittingGoal(true);
    try {
      const res = await resetGoal();
      if (res?.data?.success) {
        setGoalSuccess("Goal deleted successfully. Configure a new goal on the dashboard.");
        setGoal(null);
      }
    } catch (err) {
      console.error(err);
      setGoalError("Failed to reset goal.");
    } finally {
      setSubmittingGoal(false);
    }
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
        description="Review your active credentials, biological metric history, and health goal targets."
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

      {/* GOAL CONFIGURATION & TARGETS SETTINGS */}
      <SectionTitle>Goal Management</SectionTitle>
      <div className="fade-up d3 glass p-5 sm:p-6 mb-4 hover:border-[var(--border-hover)]">
        <SectionHeader icon="🎯" title="Health Goal Targets" badge={goal ? (goal.status === "paused" ? "Paused" : "Active Tracking") : "Unconfigured"} badgeColor={goal ? (goal.status === "paused" ? "amber" : "cyan") : "violet"} />
        
        {loadingGoal ? (
          <div className="py-4 text-center text-xs text-[var(--text-muted)]">Loading active goals settings...</div>
        ) : !goal ? (
          <div className="py-4 text-center">
            <p className="text-[13.5px] text-[var(--text-secondary)] mb-4">You have no active health goals configured yet.</p>
            <Link to="/" className="btn btn-cyan text-xs h-9 px-4 inline-flex items-center justify-center font-bold">
              Set Up Goal on Dashboard →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-2">
            {goalSuccess && <div className="p-3 rounded-xl bg-[var(--emerald-dim)] border border-[var(--border-accent-emerald)] text-[var(--emerald)] text-xs">✓ {goalSuccess}</div>}
            {goalError && <div className="p-3 rounded-xl bg-[var(--red-dim)] border border-rgba(248,113,113,0.2) text-[var(--red)] text-xs">⚠️ {goalError}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <FieldLabel>Target Weight (kg)</FieldLabel>
                <input
                  type="number"
                  step="0.1"
                  className="field-input w-full h-10 text-xs"
                  value={editTargetWeight}
                  onChange={(e) => setEditTargetWeight(e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Target Finish Date</FieldLabel>
                <input
                  type="date"
                  className="field-input w-full h-10 text-xs"
                  value={editTargetDate}
                  onChange={(e) => setEditTargetDate(e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Activity Level</FieldLabel>
                <select
                  value={editActivity}
                  onChange={(e) => setEditActivity(e.target.value)}
                  className="field-input w-full h-10 text-xs cursor-pointer"
                >
                  <option value="Sedentary">Sedentary</option>
                  <option value="Lightly Active">Lightly Active</option>
                  <option value="Moderately Active">Moderately Active</option>
                  <option value="Very Active">Very Active</option>
                  <option value="Extra Active">Extra Active</option>
                </select>
              </div>

              <div>
                <FieldLabel>Daily Calories (kcal)</FieldLabel>
                <input
                  type="number"
                  className="field-input w-full h-10 text-xs"
                  value={editCalories}
                  onChange={(e) => setEditCalories(e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Protein Goal (g)</FieldLabel>
                <input
                  type="number"
                  className="field-input w-full h-10 text-xs"
                  value={editProtein}
                  onChange={(e) => setEditProtein(e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Carbohydrates Goal (g)</FieldLabel>
                <input
                  type="number"
                  className="field-input w-full h-10 text-xs"
                  value={editCarbs}
                  onChange={(e) => setEditCarbs(e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Fats Goal (g)</FieldLabel>
                <input
                  type="number"
                  className="field-input w-full h-10 text-xs"
                  value={editFat}
                  onChange={(e) => setEditFat(e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Hydration Target (glasses)</FieldLabel>
                <input
                  type="number"
                  className="field-input w-full h-10 text-xs"
                  value={editWater}
                  onChange={(e) => setEditWater(e.target.value)}
                />
              </div>

              <div className="flex flex-col justify-end">
                <span className="text-[10px] text-[var(--text-muted)] italic leading-tight mb-1.5">
                  Changing parameters recalculates targets unless overridden manually.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 mt-3 pt-3 border-t border-[var(--border)]">
              <ActionButton
                onClick={handleUpdateGoalTargets}
                loading={submittingGoal}
                color="cyan"
                className="h-9 text-xs px-4 font-bold"
              >
                Save Settings
              </ActionButton>
              
              <button
                onClick={handleToggleGoalStatus}
                disabled={submittingGoal}
                className="btn btn-ghost h-9 text-xs px-4 border border-white/5 hover:border-[var(--border-hover)]"
              >
                {goal.status === "paused" ? "▶ Resume Goal" : "⏸ Pause Goal"}
              </button>

              <button
                onClick={handleResetGoal}
                disabled={submittingGoal}
                className="btn btn-ghost h-9 text-xs px-4 ml-auto text-[var(--red)] border border-rgba(248,113,113,0.1) hover:bg-[var(--red-dim)]"
              >
                Reset Goal Target
              </button>
            </div>
          </div>
        )}
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
      <div className="fade-up d4 glass p-5 sm:p-6 mb-4 hover:border-[var(--border-hover)]">
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
            <p className="m-0 text-[13px] text-[var(--text-muted)]">
              No habit entries yet. Save your first one from the Diet & Calories page.
            </p>
          )}
        </div>
      </div>

      <SectionTitle>Platform Status</SectionTitle>
      <div className="fade-up d5 glass p-5 sm:p-6 mb-8 hover:border-[var(--border-hover)]">
        <SectionHeader icon="⚙️" title="PWA & Network Systems" badge="v1.0.0" badgeColor="cyan" />
        <div className="mt-2">
          <div className="stat-row py-3 flex items-center justify-between">
            <span className="text-[13.5px] text-[var(--text-secondary)] font-medium">Application Version</span>
            <span className="text-[13px] text-[var(--text-primary)] font-semibold font-mono">v1.0.0 (Production)</span>
          </div>
          <div className="stat-row py-3 flex items-center justify-between">
            <span className="text-[13.5px] text-[var(--text-secondary)] font-medium">Network Connection</span>
            <span className={`badge ${isOnline ? "badge-emerald" : "badge-amber"} text-[9px]`}>
              {isOnline ? "Online (Live sync)" : "Offline Mode"}
            </span>
          </div>
          <div className="stat-row py-3 flex items-center justify-between">
            <span className="text-[13.5px] text-[var(--text-secondary)] font-medium">PWA Native Shell</span>
            <span className="text-[13px] text-[var(--text-primary)] font-semibold">
              {isStandalone ? "Stand-alone Application ✔" : "Running in Web Browser"}
            </span>
          </div>
          <div className="stat-row py-3 flex items-center justify-between">
            <span className="text-[13.5px] text-[var(--text-secondary)] font-medium">Service Worker Engine</span>
            <span className={`badge ${swActive ? "badge-cyan" : "badge-violet"} text-[9px]`}>
              {swActive ? "Active & Pre-cached" : "Registering SW"}
            </span>
          </div>
          <div className="stat-row py-3 flex items-center justify-between">
            <span className="text-[13.5px] text-[var(--text-secondary)] font-medium">Security Policy</span>
            <span className="text-[13px] text-[var(--cyan)] font-semibold">JWT sessions bypassed (Strict Secure SW)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
