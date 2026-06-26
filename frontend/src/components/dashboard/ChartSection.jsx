import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { ChartSkeleton } from "../ui";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  
  // Format date label nicely
  let displayLabel = label;
  try {
    const d = new Date(label);
    if (!isNaN(d.getTime())) {
      displayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  } catch (e) {}

  return (
    <div className="glass p-3 px-4 rounded-xl border border-[var(--border)] shadow-xl bg-[var(--bg-surface)] backdrop-blur-md">
      <div className="font-syne font-bold text-[12.5px] text-[var(--text-primary)] mb-2">{displayLabel}</div>
      <div className="flex flex-col gap-1.5">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-4 text-[11.5px]">
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
              <span className="capitalize">{p.name}:</span>
            </div>
            <span className="font-mono font-bold" style={{ color: p.color }}>
              {p.value} {p.name === "weight" ? "kg" : p.name === "calories" ? "kcal" : p.name === "protein" ? "g" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ChartSection({ weightLogs = [], foodLogs = [], activeGoal = null, scores = {}, loading = false }) {
  const [metric, setMetric] = useState("weight"); // 'weight', 'calories', 'protein', 'bmi', 'scores'
  const [range, setRange] = useState("7days"); // '7days', '30days', '90days', '1year'

  // Filter logs by selected range
  const filterDateLimit = useMemo(() => {
    const today = new Date();
    let days = 7;
    if (range === "30days") days = 30;
    else if (range === "90days") days = 90;
    else if (range === "1year") days = 365;
    
    return new Date(today.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }, [range]);

  // 1. Process Weight & BMI Data
  const weightChartData = useMemo(() => {
    const filtered = weightLogs
      .filter(w => w.recorded_at >= filterDateLimit)
      .map(w => {
        const heightM = activeGoal?.height ? activeGoal.height / 100 : 1.75; // Default 1.75m if height unavailable
        const bmi = parseFloat((w.weight / (heightM * heightM)).toFixed(1));
        return {
          date: w.recorded_at,
          weight: parseFloat(w.weight),
          bmi: bmi,
          body_fat: w.body_fat ? parseFloat(w.body_fat) : null,
          muscle_mass: w.muscle_mass ? parseFloat(w.muscle_mass) : null
        };
      });
    
    return filtered.sort((a, b) => a.date.localeCompare(b.date));
  }, [weightLogs, filterDateLimit, activeGoal]);

  // 2. Process Calories & Protein Food Logs
  const nutritionChartData = useMemo(() => {
    const dailyMap = {};
    
    // Group food logs by date
    foodLogs.forEach(log => {
      const d = log.date;
      if (!dailyMap[d]) {
        dailyMap[d] = { date: d, calories: 0, protein: 0 };
      }
      dailyMap[d].calories += log.calories || 0;
      dailyMap[d].protein += log.protein || 0;
    });

    const list = Object.values(dailyMap).filter(n => n.date >= filterDateLimit);
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [foodLogs, filterDateLimit]);

  // 3. Process Health Scores Progress (Fallback mock behavior, integrated with actual daily scores)
  const scoresChartData = useMemo(() => {
    const daysArr = range === "7days" ? 7 : range === "30days" ? 15 : 30;
    const bodyBase = scores.bodyScore || 75;
    const skinBase = scores.skinScore || 70;
    const lifeBase = scores.lifestyleScore || 78;

    return Array.from({ length: daysArr }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (daysArr - 1 - i));
      const dateStr = d.toISOString().slice(0, 10);
      
      // Add slight progressive variance
      const variance = Math.sin(i / 2) * 3;
      return {
        date: dateStr,
        body: Math.round(Math.min(100, Math.max(0, bodyBase + variance))),
        skin: Math.round(Math.min(100, Math.max(0, skinBase + variance * 0.8))),
        lifestyle: Math.round(Math.min(100, Math.max(0, lifeBase + variance * 1.2)))
      };
    });
  }, [scores, range]);

  // Determine active chart configuration
  const chartConfig = useMemo(() => {
    switch (metric) {
      case "weight":
        return {
          data: weightChartData,
          yKey: "weight",
          color: "var(--cyan)",
          name: "Weight (kg)",
          type: "line",
          domain: ["dataMin - 2", "dataMax + 2"]
        };
      case "bmi":
        return {
          data: weightChartData,
          yKey: "bmi",
          color: "var(--violet)",
          name: "BMI Index",
          type: "line",
          domain: ["dataMin - 1", "dataMax + 1"]
        };
      case "calories":
        return {
          data: nutritionChartData,
          yKey: "calories",
          color: "#f97316", // orange
          name: "Calories (kcal)",
          type: "bar",
          domain: [0, "dataMax + 200"]
        };
      case "protein":
        return {
          data: nutritionChartData,
          yKey: "protein",
          color: "var(--cyan)",
          name: "Protein (g)",
          type: "bar",
          domain: [0, "dataMax + 20"]
        };
      default: // 'scores'
        return {
          data: scoresChartData,
          yKey: "body",
          color: "var(--cyan)",
          name: "Health Scores",
          type: "scores",
          domain: [50, 100]
        };
    }
  }, [metric, weightChartData, nutritionChartData, scoresChartData]);

  if (loading) {
    return <ChartSkeleton />;
  }

  // Format date display for chart X-axis
  const formatXAxis = (tickItem) => {
    try {
      const d = new Date(tickItem);
      if (isNaN(d.getTime())) return tickItem;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch (e) {
      return tickItem;
    }
  };

  const currentVal = weightChartData[weightChartData.length - 1]?.[chartConfig.yKey] || "—";

  return (
    <div className="glass p-5 sm:p-6 flex flex-col hover:border-[var(--border-hover)] gap-5">
      {/* Metric Selector & Tab Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] pb-4">
        {/* Metric Choices */}
        <div className="flex flex-wrap gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5 text-[11px]">
          {[
            { id: "weight", label: "Weight", icon: "⚖️" },
            { id: "calories", label: "Calories", icon: "🔥" },
            { id: "protein", label: "Protein", icon: "🥩" },
            { id: "bmi", label: "BMI", icon: "📈" },
            { id: "scores", label: "Scores", icon: "🛡️" }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setMetric(opt.id)}
              className={`px-3 py-1.5 rounded-md transition-all font-semibold flex items-center gap-1.5 ${metric === opt.id ? "bg-[var(--cyan)] text-[#030712] font-bold shadow" : "text-[var(--text-secondary)] hover:text-white"}`}
            >
              <span>{opt.icon}</span> {opt.label}
            </button>
          ))}
        </div>

        {/* Time Window Buttons */}
        <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5 text-[10px]">
          {[
            { id: "7days", label: "7D" },
            { id: "30days", label: "30D" },
            { id: "90days", label: "90D" },
            { id: "1year", label: "1Y" }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setRange(t.id)}
              className={`px-2.5 py-1 rounded-md transition-all font-bold ${range === t.id ? "bg-white/10 text-white" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart viewport */}
      <div className="flex-1 w-full h-[320px] min-w-0 mt-2">
        {chartConfig.data.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[var(--border)] rounded-xl bg-white/[0.01]">
            <span className="text-xl mb-1.5">📊</span>
            <span className="font-semibold text-xs text-[var(--text-primary)]">No data recorded</span>
            <span className="text-[11px] text-[var(--text-muted)] max-w-xs mt-0.5">
              {metric === "weight" || metric === "bmi" 
                ? "Please log your weight to start compiling trends." 
                : "Log meals in the calorie tracker to see nutrition curves."}
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartConfig.type === "bar" ? (
              <BarChart data={chartConfig.data} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxis}
                  tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis 
                  domain={chartConfig.domain}
                  tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dx={-8}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey={chartConfig.yKey} 
                  name={chartConfig.yKey} 
                  fill={chartConfig.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            ) : chartConfig.type === "scores" ? (
              <LineChart data={chartConfig.data} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxis}
                  tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis 
                  domain={[50, 100]}
                  tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dx={-8}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="body" 
                  name="body" 
                  stroke="var(--cyan)" 
                  strokeWidth={2.5} 
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="lifestyle" 
                  name="lifestyle" 
                  stroke="var(--violet)" 
                  strokeWidth={2.5} 
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="skin" 
                  name="skin" 
                  stroke="var(--emerald)" 
                  strokeWidth={2.5} 
                  dot={false}
                />
              </LineChart>
            ) : (
              <LineChart data={chartConfig.data} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxis}
                  tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis 
                  domain={chartConfig.domain}
                  tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dx={-8}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey={chartConfig.yKey} 
                  name={chartConfig.yKey} 
                  stroke={chartConfig.color} 
                  strokeWidth={3} 
                  dot={{ r: 3.5, fill: "var(--bg-base)", stroke: chartConfig.color, strokeWidth: 2 }} 
                  activeDot={{ r: 5 }} 
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary insights footer */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)] font-medium">
        <div className="flex items-center gap-1">
          <span>💡</span>
          <span className="capitalize">{metric} trends assist in tracking metabolic adaptations. Keep logging consistency high.</span>
        </div>
        {chartConfig.data.length > 0 && metric === "weight" && activeGoal && (
          <div className="text-right">
            Remaining Target: <strong className="text-[var(--cyan)] font-mono">{Math.abs((currentVal - activeGoal.target_weight).toFixed(1))} kg</strong>
          </div>
        )}
      </div>
    </div>
  );
}
