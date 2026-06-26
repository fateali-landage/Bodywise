import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useBodyWise } from "../context/BodyWiseContext";
import {
  EmptyState,
  PageHeader,
  ResultBox,
  ScoreRing,
  SectionHeader,
  SectionTitle,
  CardSkeleton,
  ChartSkeleton,
  ScoreSkeleton,
  ActionButton,
  FieldLabel
} from "../components/ui";
import StatCard from "../components/dashboard/StatCard";
import InsightCard from "../components/dashboard/InsightCard";
import HabitCard from "../components/dashboard/HabitCard";
import ChartSection from "../components/dashboard/ChartSection";
import {
  getActiveGoal,
  createOrUpdateGoal,
  resetGoal,
  getWeightHistory,
  addWeightLog,
  getDailyFoodLog,
  getFoodLogsRange
} from "../services/api";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function DashboardPage() {
  const { user, scores, result, inputs, habitItems, loading: contextLoading } = useBodyWise();

  // Core Goal & Weight States
  const [goal, setGoal] = useState(null);
  const [loadingGoal, setLoadingGoal] = useState(true);
  const [weightLogs, setWeightLogs] = useState([]);
  const [loadingWeight, setLoadingWeight] = useState(false);
  const [foodLogsRange, setFoodLogsRange] = useState([]);
  const [loadingRangeLogs, setLoadingRangeLogs] = useState(false);
  
  // Daily Logs stats (to track today's actual calories/protein)
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);

  // Setup Wizard Form Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardGoalType, setWizardGoalType] = useState("Lose Weight");
  const [wizardCurrentWeight, setWizardCurrentWeight] = useState("");
  const [wizardTargetWeight, setWizardTargetWeight] = useState("");
  const [wizardHeight, setWizardHeight] = useState("");
  const [wizardAge, setWizardAge] = useState("");
  const [wizardGender, setWizardGender] = useState("Male");
  const [wizardActivity, setWizardActivity] = useState("Moderately Active");
  const [wizardWeeklyGoal, setWizardWeeklyGoal] = useState("lose-0.5");
  const [wizardTargetDate, setWizardTargetDate] = useState("");
  const [wizardError, setWizardError] = useState("");
  const [wizardSubmitting, setWizardSubmitting] = useState(false);

  // Weight Logging Modal State
  const [isWeightLogOpen, setIsWeightLogOpen] = useState(false);
  const [logWeightVal, setLogWeightVal] = useState("");
  const [logBodyFat, setLogBodyFat] = useState("");
  const [logMuscleMass, setLogMuscleMass] = useState("");
  const [logWeightDate, setLogWeightDate] = useState(new Date().toISOString().slice(0, 10));
  const [logWeightError, setLogWeightError] = useState("");
  const [logWeightSubmitting, setLogWeightSubmitting] = useState(false);

  const emailName = user?.email ? user.email.split("@")[0] : "friend";
  const firstName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
  const lastUpdated = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const todayStr = new Date().toISOString().slice(0, 10);

  // Fetch Goals & History
  const fetchGoalAndProgress = async () => {
    if (!user?.id) return;
    try {
      setLoadingGoal(true);
      const res = await getActiveGoal();
      if (res?.success && res?.data) {
        setGoal(res.data);
      } else {
        setGoal(null);
      }
    } catch (err) {
      console.error("Error loading active health goal:", err);
    } finally {
      setLoadingGoal(false);
    }
  };

  const fetchWeightLogs = async () => {
    if (!user?.id) return;
    try {
      setLoadingWeight(true);
      const res = await getWeightHistory("1year");
      if (res?.success && res?.data) {
        setWeightLogs(res.data);
      }
    } catch (err) {
      console.error("Error loading weight logs:", err);
    } finally {
      setLoadingWeight(false);
    }
  };

  const fetchRangeLogs = async () => {
    if (!user?.id) return;
    try {
      setLoadingRangeLogs(true);
      const start = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const end = new Date().toISOString().slice(0, 10);
      const res = await getFoodLogsRange(start, end);
      if (res?.success && res?.data) {
        setFoodLogsRange(res.data);
        
        // Sum today's intake
        const todayItems = res.data.filter(l => l.date === todayStr);
        const cals = todayItems.reduce((s, i) => s + (i.calories || 0), 0);
        const prot = todayItems.reduce((s, i) => s + (i.protein || 0), 0);
        setTodayCalories(cals);
        setTodayProtein(prot);
      }
    } catch (err) {
      console.error("Error loading food logs range:", err);
    } finally {
      setLoadingRangeLogs(false);
    }
  };

  useEffect(() => {
    fetchGoalAndProgress();
    fetchWeightLogs();
    fetchRangeLogs();
  }, [user?.id]);

  // Calculations for weight progress
  const progressStats = useMemo(() => {
    if (!goal) return null;

    const wInit = weightLogs[0]?.weight ? parseFloat(weightLogs[0].weight) : parseFloat(goal.current_weight);
    const wCurr = parseFloat(goal.current_weight);
    const wTarget = parseFloat(goal.target_weight);

    // Remaining weight
    const weightRemaining = Math.max(Math.abs(wCurr - wTarget), 0);

    // Total target distance
    const totalDistance = Math.abs(wInit - wTarget);

    // Current distance completed
    const currentCompleted = Math.abs(wInit - wCurr);

    let completionPct = 0;
    if (totalDistance > 0) {
      completionPct = Math.min(100, Math.round((currentCompleted / totalDistance) * 100));
    } else {
      completionPct = 100;
    }

    // Weight lost or gained
    const diff = wCurr - wInit;
    const isLoss = goal.goal_type.toLowerCase().includes("lose");
    let progressLabel = "";
    if (isLoss) {
      progressLabel = diff <= 0 ? `${Math.abs(diff).toFixed(1)} kg lost` : `${Math.abs(diff).toFixed(1)} kg gained`;
    } else {
      progressLabel = diff >= 0 ? `${Math.abs(diff).toFixed(1)} kg gained` : `${Math.abs(diff).toFixed(1)} kg lost`;
    }

    // Estimated completion date
    let estCompletionDate = "TBD";
    if (goal.weekly_goal && goal.weekly_goal !== "maintain") {
      let weeklyRate = 0.5; // default
      if (goal.weekly_goal.includes("0.25")) weeklyRate = 0.25;
      else if (goal.weekly_goal.includes("1.0")) weeklyRate = 1.0;
      
      const weeksNeeded = weightRemaining / weeklyRate;
      if (weeksNeeded > 0 && isFinite(weeksNeeded)) {
        const estDate = new Date();
        estDate.setDate(estDate.getDate() + Math.round(weeksNeeded * 7));
        estCompletionDate = estDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
    } else {
      estCompletionDate = "Maintaining Weight";
    }

    return {
      weightRemaining: weightRemaining.toFixed(1),
      completionPct,
      progressLabel,
      estCompletionDate
    };
  }, [goal, weightLogs]);

  // Streak calculations
  const consistencyStreak = useMemo(() => {
    // If they have weight logs or tracked items, we can calculate active streaks
    // Let's return a default of 5 or count logged days
    if (weightLogs.length === 0) return 1;
    let streak = 1;
    // Basic streak check: count how many days they logged weight consecutively from yesterday
    const uniqueDates = Array.from(new Set(weightLogs.map(w => w.recorded_at))).sort().reverse();
    if (uniqueDates.length === 0) return 0;
    
    let current = new Date();
    // Check if logged today or yesterday
    const d0 = current.toISOString().slice(0, 10);
    current.setDate(current.getDate() - 1);
    const d1 = current.toISOString().slice(0, 10);

    if (uniqueDates[0] !== d0 && uniqueDates[0] !== d1) return 0;

    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const dateA = new Date(uniqueDates[i]);
      const dateB = new Date(uniqueDates[i+1]);
      const diffTime = Math.abs(dateA - dateB);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [weightLogs]);

  // Achievements & Badges calculation
  const achievements = useMemo(() => {
    const list = [];
    const logsCount = foodLogsRange.length;
    const wCount = weightLogs.length;

    if (wCount >= 1) list.push({ icon: "⚖️", title: "Weight Logged", desc: "First weight entry logged" });
    if (consistencyStreak >= 7) list.push({ icon: "🔥", title: "7-Day Streak", desc: "Logged 7 days consecutively" });
    if (consistencyStreak >= 30) list.push({ icon: "👑", title: "30-Day Streak", desc: "Logged 30 days consecutively" });
    
    if (progressStats) {
      const pct = progressStats.completionPct;
      if (pct >= 25) list.push({ icon: "🥉", title: "Goal 25%", desc: "Reached 25% of weight goal" });
      if (pct >= 50) list.push({ icon: "🥈", title: "Goal 50%", desc: "Reached half way to target" });
      if (pct >= 75) list.push({ icon: "🥇", title: "Goal 75%", desc: "Reached 75% of weight goal" });
      if (pct >= 100) list.push({ icon: "🏆", title: "Goal Completed", desc: "Reached target weight goal!" });
    }

    if (logsCount >= 100) list.push({ icon: "🍎", title: "100 Meals", desc: "Logged 100 food items" });

    return list;
  }, [weightLogs, foodLogsRange, progressStats, consistencyStreak]);

  // Setup Wizard Save
  const handleCreateGoal = async () => {
    const curW = parseFloat(wizardCurrentWeight);
    const tarW = parseFloat(wizardTargetWeight);
    const h = parseFloat(wizardHeight);
    const a = parseInt(wizardAge, 10);

    if (isNaN(curW) || isNaN(tarW) || isNaN(h) || isNaN(a) || !wizardGoalType || !wizardActivity) {
      setWizardError("Please enter valid numerical values for weight, height, and age.");
      return;
    }

    setWizardError("");
    setWizardSubmitting(true);
    try {
      const payload = {
        goal_type: wizardGoalType,
        current_weight: curW,
        target_weight: tarW,
        height: h,
        age: a,
        gender: wizardGender,
        activity_level: wizardActivity,
        weekly_goal: wizardWeeklyGoal,
        target_date: wizardTargetDate || null
      };

      const res = await createOrUpdateGoal(payload);
      if (res?.success) {
        setIsWizardOpen(false);
        fetchGoalAndProgress();
        fetchWeightLogs();
      }
    } catch (err) {
      console.error(err);
      setWizardError(err.message || "Failed to save health goal details.");
    } finally {
      setWizardSubmitting(false);
    }
  };

  // Weight Logging Save
  const handleSaveWeightLog = async () => {
    const weightNum = parseFloat(logWeightVal);
    if (isNaN(weightNum) || weightNum <= 0) {
      setLogWeightError("Please enter a valid weight value.");
      return;
    }

    setLogWeightError("");
    setLogWeightSubmitting(true);
    try {
      const payload = {
        weight: weightNum,
        body_fat: logBodyFat ? parseFloat(logBodyFat) : null,
        muscle_mass: logMuscleMass ? parseFloat(logMuscleMass) : null,
        recorded_at: logWeightDate
      };
      const res = await addWeightLog(payload);
      if (res?.success) {
        setIsWeightLogOpen(false);
        setLogWeightVal("");
        setLogBodyFat("");
        setLogMuscleMass("");
        fetchGoalAndProgress();
        fetchWeightLogs();
      }
    } catch (err) {
      console.error(err);
      setLogWeightError(err.message || "Failed to log weight entry.");
    } finally {
      setLogWeightSubmitting(false);
    }
  };

  // Calorie calculations based on goal
  const calorieGoal = goal ? goal.daily_calorie_goal : 2400;
  const proteinGoal = goal ? goal.protein_goal : 150;
  const waterGoal = goal ? goal.water_goal : 8;

  const caloriesRemaining = Math.max(calorieGoal - todayCalories, 0);

  const bmi = goal && goal.current_weight && goal.height 
    ? (goal.current_weight / ((goal.height / 100) * (goal.height / 100))).toFixed(1)
    : (result.body?.bmi ?? "—");

  const bmiStatus = goal && goal.current_weight && goal.height
    ? (bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal Weight" : bmi < 30 ? "Overweight" : "Obese")
    : (result.body?.status ?? "Not analyzed");

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Goal Management Panel"
        title={
          <>
            {getGreeting()},{" "}
            <span style={{ background: "linear-gradient(135deg, var(--cyan), var(--violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800 }}>
              {firstName}
            </span>
          </>
        }
        description={
          <span>
            Monitor active health goals, weight history trends, and macro-level tracking summaries.{" "}
            <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 6 }}>
              Sync active (Last updated {lastUpdated})
            </span>
          </span>
        }
      />

      {loadingGoal || contextLoading.body ? (
        <>
          <SectionTitle>Syncing Goals & Metrics...</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <ChartSkeleton />
        </>
      ) : (
        <>
          {/* ── Goal Status Check / Setup Call to Action ── */}
          {!goal && (
            <div className="fade-up d1 glass p-6 sm:p-8 rounded-xl border border-dashed border-[var(--border-accent)] bg-[var(--cyan-dim)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="badge badge-cyan mb-2">Configure Goals</span>
                <h3 className="display m-0 text-lg sm:text-xl text-[var(--text-primary)]">
                  Unlock Personalized Health Targets
                </h3>
                <p className="mt-1.5 mb-0 text-[13.5px] text-[var(--text-secondary)] leading-relaxed max-w-xl">
                  You don't have an active health goal configured. Complete the quick wizard setup to automatically calculate BMR calories, macro splits, and water intake targets.
                </p>
              </div>
              <button 
                onClick={() => {
                  setWizardError("");
                  setIsWizardOpen(true);
                }} 
                className="btn btn-cyan w-full md:w-auto mt-0 whitespace-nowrap text-center justify-center shrink-0 h-11 px-6 font-bold"
              >
                Set Up Goal Wizard →
              </button>
            </div>
          )}

          {/* ── Top Stats Row ── */}
          <SectionTitle>Personalized Health Metrics</SectionTitle>
          <section className="fade-up d1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              icon="⚖️" 
              label="Weight & BMI"    
              value={goal ? `${goal.current_weight} kg` : "—"}   
              sub={`BMI: ${bmi} (${bmiStatus})`}               
              accent="var(--cyan)" 
            />
            <StatCard 
              icon="🔥" 
              label="Caloric Budget"     
              value={`${todayCalories.toLocaleString()} / ${calorieGoal.toLocaleString()}`} 
              sub={`${caloriesRemaining.toLocaleString()} kcal remaining`}         
              accent="#f97316" 
            />
            <StatCard 
              icon="🥩" 
              label="Protein Intake" 
              value={`${todayProtein}g / ${proteinGoal}g`}     
              sub="Required daily muscle repair"          
              accent="var(--violet)" 
            />
            <StatCard 
              icon="🌙" 
              label="Water & Streak"        
              value={`${habitItems?.water ? "8" : "6"} / ${waterGoal}`} 
              sub={`${consistencyStreak} day logging streak 🔥`} 
              accent="#0ea5e9" 
            />
          </section>

          {/* ── Active Goal Progress Section ── */}
          {goal && progressStats && (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 mt-4">
              <div className="flex flex-col gap-3">
                <SectionTitle>Active Goal Progress</SectionTitle>
                <div className="fade-up d2 glass p-5 sm:p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-stretch hover:border-[var(--border-hover)]">
                  {/* Circle completion ring */}
                  <div className="relative w-[130px] h-[130px] flex items-center justify-center shrink-0 bg-white/[0.02] rounded-full border border-white/5 shadow-inner">
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="6" />
                      <circle
                        cx="60" cy="60" r="50" fill="none"
                        stroke="var(--cyan)" strokeWidth="7" strokeLinecap="round"
                        strokeDasharray={`${(progressStats.completionPct / 100) * 2 * Math.PI * 50} ${2 * Math.PI * 50}`}
                        style={{ filter: "drop-shadow(0 0 6px rgba(0,229,190,0.3))", transition: "stroke-dasharray 1s" }}
                      />
                    </svg>
                    <div className="text-center relative z-10">
                      <div className="font-syne font-extrabold text-2xl text-[var(--cyan)]">
                        {progressStats.completionPct}%
                      </div>
                      <div className="text-[9px] text-[var(--text-muted)] mt-0.5 tracking-wider uppercase font-mono">Complete</div>
                    </div>
                  </div>

                  {/* Goal Metadata details */}
                  <div className="flex flex-col justify-between flex-1 w-full gap-4">
                    <div className="flex justify-between items-start flex-wrap gap-2 border-b border-[var(--border)] pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--cyan)] font-extrabold bg-[var(--cyan-dim)] px-2 py-0.5 rounded-full border border-[var(--border-accent)]">
                          {goal.goal_type}
                        </span>
                        <h4 className="text-[14.5px] font-bold text-[var(--text-primary)] mt-1.5 capitalize">
                          Target: {goal.target_weight} kg · {progressStats.progressLabel}
                        </h4>
                      </div>
                      <button
                        onClick={() => {
                          setLogWeightError("");
                          setIsWeightLogOpen(true);
                        }}
                        className="btn btn-cyan h-8 text-[11px] px-3 font-bold"
                      >
                        ⚖️ Log Weight
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Weight Remaining</div>
                        <div className="font-syne font-extrabold text-lg text-[var(--text-primary)] mt-1">{progressStats.weightRemaining} kg</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Weekly Goal Pace</div>
                        <div className="font-syne font-extrabold text-lg text-[var(--text-primary)] mt-1 capitalize">
                          {goal.weekly_goal.replace("lose-", "-").replace("gain-", "+")} kg
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Est. Target Date</div>
                        <div className="font-syne font-extrabold text-lg text-[var(--text-primary)] mt-1">{progressStats.estCompletionDate}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievements & Milestones Drawer */}
              <div className="flex flex-col gap-3">
                <SectionTitle>Milestones & Badges</SectionTitle>
                <div className="fade-up d2 glass p-5 flex flex-col h-full hover:border-[var(--border-hover)] max-h-[178px] overflow-y-auto pr-2 gap-3">
                  {achievements.length === 0 ? (
                    <div className="text-center py-4 text-xs text-[var(--text-muted)]">
                      🏅 Complete tasks to unlock your health milestones!
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {achievements.map((badge, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg bg-white/5 border border-white/5">
                          <span className="text-lg">{badge.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-[var(--text-primary)]">{badge.title}</div>
                            <div className="text-[9px] text-[var(--text-muted)] font-medium mt-0.5">{badge.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── AI Insight + Today Summary ── */}
          <SectionTitle>AI Insights & Personal Coaching</SectionTitle>
          <div className="fade-up d3 grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,360px)] gap-5 items-stretch">
            <InsightCard insight={result.lifestyle?.insight} loading={loadingGoal} />
            
            {/* Quick Goals Targets Display */}
            <div className="glass p-5 sm:p-6 h-full flex flex-col justify-between hover:border-[var(--border-hover)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">🎯</span>
                <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">Goal Targets</span>
              </div>
              <div className="flex flex-col gap-3.5 flex-1 justify-center">
                {[
                  { label: "Daily Energy Goal", val: calorieGoal, unit: "kcal", color: "#f97316", progress: Math.min(100, Math.round((todayCalories / calorieGoal) * 100)) },
                  { label: "Daily Protein Target", val: proteinGoal, unit: "grams", color: "var(--violet)", progress: Math.min(100, Math.round((todayProtein / proteinGoal) * 100)) },
                  { label: "Hydration Intake", val: waterGoal, unit: "glasses", color: "#0ea5e9", progress: habitItems?.water ? 100 : 75 }
                ].map(item => (
                  <div key={item.label} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[var(--text-secondary)]">{item.label}</span>
                      <span className="font-mono font-bold" style={{ color: item.color }}>{item.progress}% ({item.val} {item.unit})</span>
                    </div>
                    <div className="progress-bar-track h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                      <div className="progress-bar-fill h-full rounded-full transition-all duration-500" style={{ width: `${item.progress}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Interactive Charts ── */}
          <SectionTitle>Analytics Trends</SectionTitle>
          <div className="fade-up d4">
            <ChartSection
              weightLogs={weightLogs}
              foodLogs={foodLogsRange}
              activeGoal={goal}
              scores={scores}
              loading={loadingWeight || loadingRangeLogs}
            />
          </div>

          {/* ── Quick Actions Recommendations ── */}
          <SectionTitle>Recommendations & Quick Actions</SectionTitle>
          <div className="fade-up d5 grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,360px)] gap-5">
            <div className="glass p-5 sm:p-6 hover:border-[var(--border-hover)] flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">💡</span>
                <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">Today's Recommendations</span>
              </div>
              <ul className="m-0 pl-4 text-[13.5px] text-[var(--text-secondary)] space-y-3 leading-relaxed">
                {goal ? (
                  <>
                    <li>⚖️ Current Weight is logged at {goal.current_weight} kg. Maintain daily weight logging to track average trends.</li>
                    <li>🔥 Daily calorie intake is {todayCalories} kcal against your MSJ calculated budget of {calorieGoal} kcal.</li>
                    <li>🥩 Ensure to eat {proteinGoal}g protein to match active goals of "{goal.goal_type}".</li>
                  </>
                ) : (
                  <li>🎯 Set up a health goal to calculate daily calories, proteins, and hydration limits.</li>
                )}
                <li>🛌 Maintain consistent sleep hygiene to recover sleep debt.</li>
              </ul>
            </div>
            
            <div className="glass p-5 sm:p-6 hover:border-[var(--border-hover)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">⚡</span>
                <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">Quick Actions</span>
              </div>
              <div className="flex flex-col gap-2">
                <Link to="/calories" className="btn btn-cyan w-full text-center text-xs h-10">
                  🍽️ Open Calorie Tracker
                </Link>
                <Link to="/coach" className="btn btn-ghost w-full text-center text-xs h-10">
                  💬 Chat with AI Coach
                </Link>
                <Link to="/analyze" className="btn btn-ghost w-full text-center text-xs h-10">
                  Run Body Scan Analysis
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SETUP HEALTH GOAL WIZARD MODAL */}
      {isWizardOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out_both]">
          <div className="glass w-full max-w-md p-6 flex flex-col gap-4 border-[var(--border-hover)]">
            <h3 className="font-syne font-bold text-base text-[var(--text-primary)]">
              🎯 Health Goal Wizard Setup
            </h3>
            
            {wizardError && (
              <div className="p-3 rounded-xl bg-[var(--red-dim)] border border-rgba(248,113,113,0.2) text-[var(--red)] text-xs">
                ⚠️ {wizardError}
              </div>
            )}
            
            <div className="flex flex-col gap-3">
              <div>
                <FieldLabel>Active Health Goal Type</FieldLabel>
                <select
                  value={wizardGoalType}
                  onChange={(e) => setWizardGoalType(e.target.value)}
                  className="field-input w-full h-10 text-sm cursor-pointer"
                >
                  <option value="Lose Weight">Lose Weight</option>
                  <option value="Gain Weight">Gain Weight</option>
                  <option value="Maintain Weight">Maintain Weight</option>
                  <option value="Build Muscle">Build Muscle</option>
                  <option value="Improve Fitness">Improve Fitness</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Current Weight (kg) *</FieldLabel>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 78.5"
                    className="field-input w-full h-10 text-sm"
                    value={wizardCurrentWeight}
                    onChange={(e) => setWizardCurrentWeight(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Target Weight (kg) *</FieldLabel>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 72.0"
                    className="field-input w-full h-10 text-sm"
                    value={wizardTargetWeight}
                    onChange={(e) => setWizardTargetWeight(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <FieldLabel>Height (cm) *</FieldLabel>
                  <input
                    type="number"
                    placeholder="175"
                    className="field-input w-full h-10 text-sm"
                    value={wizardHeight}
                    onChange={(e) => setWizardHeight(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Age (years) *</FieldLabel>
                  <input
                    type="number"
                    placeholder="30"
                    className="field-input w-full h-10 text-sm"
                    value={wizardAge}
                    onChange={(e) => setWizardAge(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Gender *</FieldLabel>
                  <select
                    value={wizardGender}
                    onChange={(e) => setWizardGender(e.target.value)}
                    className="field-input w-full h-10 text-sm cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Activity Level *</FieldLabel>
                  <select
                    value={wizardActivity}
                    onChange={(e) => setWizardActivity(e.target.value)}
                    className="field-input w-full h-10 text-sm cursor-pointer"
                  >
                    <option value="Sedentary">Sedentary</option>
                    <option value="Lightly Active">Lightly Active</option>
                    <option value="Moderately Active">Moderately Active</option>
                    <option value="Very Active">Very Active</option>
                    <option value="Extra Active">Extra Active</option>
                  </select>
                </div>

                <div>
                  <FieldLabel>Weekly Target Pace</FieldLabel>
                  {wizardGoalType.includes("Lose") ? (
                    <select
                      value={wizardWeeklyGoal}
                      onChange={(e) => setWizardWeeklyGoal(e.target.value)}
                      className="field-input w-full h-10 text-sm cursor-pointer"
                    >
                      <option value="lose-0.25">Lose 0.25 kg/week</option>
                      <option value="lose-0.5">Lose 0.5 kg/week</option>
                      <option value="lose-1.0">Lose 1.0 kg/week</option>
                    </select>
                  ) : wizardGoalType.includes("Gain") ? (
                    <select
                      value={wizardWeeklyGoal}
                      onChange={(e) => setWizardWeeklyGoal(e.target.value)}
                      className="field-input w-full h-10 text-sm cursor-pointer"
                    >
                      <option value="gain-0.25">Gain 0.25 kg/week</option>
                      <option value="gain-0.5">Gain 0.5 kg/week</option>
                    </select>
                  ) : (
                    <input
                      className="field-input w-full h-10 text-sm opacity-60 cursor-not-allowed"
                      value="Maintain Constant"
                      disabled
                    />
                  )}
                </div>
              </div>

              <div>
                <FieldLabel>Target Finish Date (optional)</FieldLabel>
                <input
                  type="date"
                  className="field-input w-full h-10 text-sm"
                  value={wizardTargetDate}
                  onChange={(e) => setWizardTargetDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => setIsWizardOpen(false)}
                className="btn btn-ghost text-xs h-9 px-4 justify-center"
              >
                Cancel
              </button>
              <ActionButton
                onClick={handleCreateGoal}
                loading={wizardSubmitting}
                color="cyan"
                className="text-xs h-9 px-4 justify-center font-bold"
              >
                Save Health Goal
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* WEIGHT LOGGER MODAL */}
      {isWeightLogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out_both]">
          <div className="glass w-full max-w-sm p-6 flex flex-col gap-4 border-[var(--border-hover)]">
            <h3 className="font-syne font-bold text-base text-[var(--text-primary)]">
              ⚖️ Log Daily Body Weight
            </h3>
            
            {logWeightError && (
              <div className="p-3 rounded-xl bg-[var(--red-dim)] border border-rgba(248,113,113,0.2) text-[var(--red)] text-xs">
                ⚠️ {logWeightError}
              </div>
            )}
            
            <div className="flex flex-col gap-3">
              <div>
                <FieldLabel>Body Weight (kg) *</FieldLabel>
                <input
                  type="number"
                  step="0.1"
                  className="field-input w-full h-10 text-sm"
                  placeholder="e.g. 74.3"
                  value={logWeightVal}
                  onChange={(e) => setLogWeightVal(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Body Fat % (optional)</FieldLabel>
                  <input
                    type="number"
                    step="0.1"
                    className="field-input w-full h-10 text-sm"
                    placeholder="e.g. 18.5"
                    value={logBodyFat}
                    onChange={(e) => setLogBodyFat(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Muscle Mass % (optional)</FieldLabel>
                  <input
                    type="number"
                    step="0.1"
                    className="field-input w-full h-10 text-sm"
                    placeholder="e.g. 42.0"
                    value={logMuscleMass}
                    onChange={(e) => setLogMuscleMass(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Recorded Date</FieldLabel>
                <input
                  type="date"
                  className="field-input w-full h-10 text-sm"
                  value={logWeightDate}
                  onChange={(e) => setLogWeightDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => setIsWeightLogOpen(false)}
                className="btn btn-ghost text-xs h-9 px-4 justify-center"
              >
                Cancel
              </button>
              <ActionButton
                onClick={handleSaveWeightLog}
                loading={logWeightSubmitting}
                color="cyan"
                className="text-xs h-9 px-4 justify-center font-bold"
              >
                Save Weight Entry
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
