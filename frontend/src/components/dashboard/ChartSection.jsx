import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
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
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)", padding: "10px 14px",
      backdropFilter: "blur(20px)", fontSize: 12, color: "var(--text-primary)",
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, fontFamily: "'Syne',sans-serif" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span style={{ color: "var(--text-secondary)" }}>{p.name}:</span>
          <span style={{ color: p.color, fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ChartSection({ scores }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,340px)] gap-4 items-stretch">
      {/* Line Chart */}
      <div className="glass p-4 sm:p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-base">📈</span>
          <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">
            Weekly Progress
          </span>
          <span className="badge badge-violet ml-auto text-[10px]">7 Days</span>
        </div>
        <div className="w-full h-[300px] min-w-0 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="body" name="Body" stroke="#00e5be" strokeWidth={2} dot={{ r: 3, fill: "#00e5be" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="lifestyle" name="Lifestyle" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: "#a78bfa" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="skin" name="Skin" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: "#34d399" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="glass p-4 sm:p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🍩</span>
          <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">
            Macro Split
          </span>
        </div>
        <div className="w-full h-[200px] min-w-0 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={macroData} cx="50%" cy="50%"
                innerRadius={60} outerRadius={85}
                paddingAngle={3} dataKey="value"
              >
                {macroData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1.5 mt-2">
          {macroData.map(({ name, value, color }) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                <span className="text-xs text-[var(--text-secondary)]">{name}</span>
              </div>
              <span className="text-xs font-bold font-mono" style={{ color }}>{value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
