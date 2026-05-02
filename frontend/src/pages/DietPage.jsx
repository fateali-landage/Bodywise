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
      <div className="fade-up d2 glass p-6 sm:p-8 mb-10">
        <SectionHeader icon="🥗" title="Meal Analyzer" badge="Nutrition AI" badgeColor="violet" />
        <div className="mt-4">
          <FieldLabel>Describe your meal</FieldLabel>
          <input
            className="field-input w-full mt-1.5"
            value={food}
            onChange={(e) => setFood(e.target.value)}
            placeholder="e.g. grilled chicken salad with olive oil"
          />
          <ActionButton
            onClick={runFood}
            loading={loading.food}
            color="violet"
            disabled={!food.trim()}
            className="w-full sm:w-auto mt-3"
          >
            {loading.food ? "Analyzing…" : "Analyze Food"}
          </ActionButton>
        </div>

        <div className="mt-6">
          {result.food ? (
            <ResultBox>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-semibold text-[var(--violet)]">{result.food.food}</span>
                <span className="badge badge-cyan mono">{result.food.estimatedCalories} kcal</span>
              </div>
              {result.food.macros && (
                <div className="mono text-xs text-[var(--text-muted)] mb-2">
                  P {result.food.macros.protein} · C {result.food.macros.carbs} · F {result.food.macros.fats}
                </div>
              )}
              <p className="m-0 text-[var(--text-secondary)]">{result.food.insight}</p>
            </ResultBox>
          ) : (
            <EmptyState message="Enter a meal description and analyze to see nutritional insights" />
          )}
        </div>
      </div>

      <SectionTitle>Daily Habits</SectionTitle>
      <div className="fade-up d3 glass p-6 sm:p-8">
        <SectionHeader icon="📋" title="Daily Habit Coach" badge="Today" badgeColor="emerald" />
        <div className="flex flex-col gap-1.5 mt-4">
          {Object.keys(habitItems).map((item) => (
            <div
              key={item}
              className="flex items-center justify-between py-3 px-3.5 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <span className="text-[13.5px] font-medium capitalize text-[var(--text-primary)]">
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
        
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <FieldLabel>Add Custom Habit</FieldLabel>
          <div className="flex gap-2 mt-1.5">
            <input 
              className="field-input flex-1" 
              placeholder="e.g. Read 10 pages" 
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.value.trim()) {
                  setHabitItems(prev => ({ ...prev, [e.target.value.trim()]: false }));
                  e.target.value = "";
                }
              }}
            />
            <button 
              className="btn btn-ghost"
              onClick={(e) => {
                const input = e.currentTarget.previousSibling;
                if (input.value.trim()) {
                  setHabitItems(prev => ({ ...prev, [input.value.trim()]: false }));
                  input.value = "";
                }
              }}
            >
              Add
            </button>
          </div>
        </div>
        <div className="mt-4">
          <ActionButton onClick={saveHabit} loading={loading.habit} color="emerald" className="w-full sm:w-auto">
            {loading.habit ? "Saving…" : "Save Today's Habits"}
          </ActionButton>
        </div>
        <div className="mt-3">
          {result.habits?.length ? (
            <p className="font-mono text-[11.5px] text-[var(--text-muted)] m-0 text-center sm:text-left">
              {result.habits.length} entries stored
            </p>
          ) : (
            <EmptyState message="No habit entries logged yet" />
          )}
        </div>
      </div>
    </>
  );
}
