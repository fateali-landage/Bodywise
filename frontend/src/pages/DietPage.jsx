import { useEffect } from "react";
import { useBodyWise } from "../context/BodyWiseContext";
import {
  ActionButton,
  EmptyState,
  ErrorBanner,
  FieldLabel,
  PageHeader,
  ResultBox,
  SectionHeader,
  SectionTitle,
  Toggle,
} from "../components/ui";

const HABIT_ICONS = { water: "💧", sleep: "😴", protein: "🥩" };

export default function DietPage() {
  const {
    food,
    setFood,
    runFood,
    habitItems,
    setHabitItems,
    saveHabit,
    refreshHabits,
    result,
    loading,
    error,
    setError,
  } = useBodyWise();

  useEffect(() => {
    refreshHabits();
  }, [refreshHabits]);

  return (
    <>
      <ErrorBanner message={error} onDismiss={() => setError(null)} />
      <PageHeader
        title="Diet & Calories"
        description="Log meals, track daily habits and get nutrition insights."
      />

      <SectionTitle>Food Intelligence</SectionTitle>
      <div className="fade-up d2 glass" style={{ padding: 28, marginBottom: 40 }}>
        <SectionHeader icon="🥗" title="Meal Analyzer" badge="Nutrition AI" badgeColor="violet" />
        <FieldLabel>Describe your meal</FieldLabel>
        <input
          className="field-input"
          value={food}
          onChange={(e) => setFood(e.target.value)}
          placeholder="e.g. grilled chicken salad with olive oil"
        />
        <ActionButton
          onClick={runFood}
          loading={loading.food}
          color="violet"
          disabled={!food.trim()}
        >
          {loading.food ? "Analyzing…" : "Analyze Food"}
        </ActionButton>

        {result.food ? (
          <ResultBox>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600, color: "var(--violet)" }}>{result.food.food}</span>
              <span className="badge badge-cyan mono">{result.food.estimatedCalories} kcal</span>
            </div>
            {result.food.macros && (
              <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                P {result.food.macros.protein} · C {result.food.macros.carbs} · F {result.food.macros.fats}
              </div>
            )}
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>{result.food.insight}</p>
          </ResultBox>
        ) : (
          <EmptyState message="Enter a meal description and analyze to see nutritional insights" />
        )}
      </div>

      <SectionTitle>Daily Habits</SectionTitle>
      <div className="fade-up d3 glass" style={{ padding: 28 }}>
        <SectionHeader icon="📋" title="Daily Habit Coach" badge="Today" badgeColor="emerald" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Object.keys(habitItems).map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
            >
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  textTransform: "capitalize",
                  color: "var(--text-primary)",
                }}
              >
                {HABIT_ICONS[item] || "•"} {item}
              </span>
              <Toggle
                checked={habitItems[item]}
                onChange={(e) => setHabitItems((prev) => ({ ...prev, [item]: e.target.checked }))}
                color="emerald"
              />
            </div>
          ))}
        </div>
        <ActionButton onClick={saveHabit} loading={loading.habit} color="emerald">
          {loading.habit ? "Saving…" : "Save Today's Habits"}
        </ActionButton>
        {result.habits?.length ? (
          <p className="mono" style={{ marginTop: 12, fontSize: 11.5, color: "var(--text-muted)" }}>
            {result.habits.length} entries stored
          </p>
        ) : (
          <EmptyState message="No habit entries logged yet" />
        )}
      </div>
    </>
  );
}
