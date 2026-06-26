import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const weeklyData = [
  { day: "Mon", body: 72, lifestyle: 68, skin: 74 },
  { day: "Tue", body: 74, lifestyle: 70, skin: 76 },
  { day: "Wed", body: 73, lifestyle: 73, skin: 75 },
  { day: "Thu", body: 76, lifestyle: 71, skin: 78 },
  { day: "Fri", body: 78, lifestyle: 75, skin: 80 },
  { day: "Sat", body: 80, lifestyle: 78, skin: 82 },
  { day: "Sun", body: 82, lifestyle: 80, skin: 84 },
];

const macroData = [
  { name: "Protein", value: 30, color: "#00e5be" },
  { name: "Carbs",   value: 45, color: "#a78bfa" },
  { name: "Fat",     value: 25, color: "#fbbf24" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass p-3 px-4 rounded-xl border border-[var(--border)] shadow-xl bg-[var(--bg-surface)] backdrop-blur-md">
      <div className="font-syne font-bold text-[12px] text-[var(--text-primary)] mb-2">{label}</div>
      <div className="flex flex-col gap-1.5">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-4 text-[11.5px]">
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
              <span>{p.name}:</span>
            </div>
            <span className="font-mono font-bold" style={{ color: p.color }}>{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ChartSection({ scores }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,340px)] gap-5 items-stretch">
      {/* Line Chart */}
      <div className="glass p-5 sm:p-6 flex flex-col hover:border-[var(--border-hover)]">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-base">📈</span>
          <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">
            Weekly Progress
          </span>
          <span className="badge badge-violet ml-auto text-[10px]">7 Days</span>
        </div>
        <div className="w-full h-[300px] min-w-0 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} />
              <XAxis 
                dataKey="day" 
                tick={{ fill: "var(--text-muted)", fontSize: 10.5, fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
                dy={8}
              />
              <YAxis 
                domain={[60, 100]} 
                tick={{ fill: "var(--text-muted)", fontSize: 10.5, fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
                dx={-8}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="body" 
                name="Body" 
                stroke="#00e5be" 
                strokeWidth={3} 
                dot={{ r: 3, fill: "var(--bg-base)", stroke: "#00e5be", strokeWidth: 2 }} 
                activeDot={{ r: 5, fill: "#00e5be", stroke: "var(--text-primary)", strokeWidth: 1 }} 
              />
              <Line 
                type="monotone" 
                dataKey="lifestyle" 
                name="Lifestyle" 
                stroke="#a78bfa" 
                strokeWidth={3} 
                dot={{ r: 3, fill: "var(--bg-base)", stroke: "#a78bfa", strokeWidth: 2 }} 
                activeDot={{ r: 5, fill: "#a78bfa", stroke: "var(--text-primary)", strokeWidth: 1 }} 
              />
              <Line 
                type="monotone" 
                dataKey="skin" 
                name="Skin" 
                stroke="#34d399" 
                strokeWidth={3} 
                dot={{ r: 3, fill: "var(--bg-base)", stroke: "#34d399", strokeWidth: 2 }} 
                activeDot={{ r: 5, fill: "#34d399", stroke: "var(--text-primary)", strokeWidth: 1 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="glass p-5 sm:p-6 flex flex-col hover:border-[var(--border-hover)] justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">🍩</span>
            <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">
              Macro Split
            </span>
          </div>
          <div className="w-full h-[180px] min-w-0 flex items-center justify-center my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData} cx="50%" cy="50%"
                  innerRadius={54} outerRadius={76}
                  paddingAngle={4} dataKey="value"
                >
                  {macroData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="var(--bg-surface)" strokeWidth={3} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(v) => `${v}%`} 
                  contentStyle={{ 
                    background: "var(--bg-surface)", 
                    border: "1px solid var(--border)", 
                    borderRadius: 12, 
                    fontSize: 12,
                    color: "var(--text-primary)"
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-[var(--border)]">
          {macroData.map(({ name, value, color }) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color, border: `1px solid ${color}40` }} />
                <span className="text-xs text-[var(--text-secondary)] font-medium">{name}</span>
              </div>
              <span className="text-xs font-bold font-mono" style={{ color }}>{value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
