import { useState, useEffect } from "react";
import { PageHeader, EmptyState, Spinner, SectionTitle } from "../components/ui";
import { getHistory } from "../services/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const { data } = await getHistory();
        if (isMounted && data?.data?.analysis) {
          setHistory(data.data.analysis);
        }
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to fetch history");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHistory();
    return () => { isMounted = false; };
  }, []);

  // Process data for charts
  const bodyHistory = history.filter(item => item.type === "body").reverse();
  
  const bmiData = bodyHistory.map(item => ({
    date: new Date(item.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    bmi: item.data?.bmi
  })).filter(d => d.bmi);

  const CustomChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[12px] shadow-lg">
        <div className="font-syne font-bold mb-1.5 text-[var(--text-primary)]">{label}</div>
        <div className="flex items-center gap-2 text-[var(--text-secondary)] font-medium">
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-[var(--cyan)]" />
          <span>BMI Score: <strong className="text-[var(--cyan)] font-mono">{payload[0].value}</strong></span>
        </div>
      </div>
    );
  };

  const getBadgeClass = (type) => {
    if (type === "body") return "badge-cyan";
    if (type === "skin") return "badge-violet";
    return "badge-amber";
  };

  return (
    <div className="page-container">
      <PageHeader 
        eyebrow="Progress Logs" 
        title="Health History" 
        description="Review your biological parameters progress, skin vision logs, and lifestyle trends over time." 
      />

      {error && <div className="p-3 mb-4 rounded-xl bg-[var(--red-dim)] border border-rgba(248,113,113,0.2) text-[var(--red)] text-xs">⚠️ {error}</div>}

      {loading ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : history.length === 0 ? (
        <div className="glass p-6 mt-2 hover:border-[var(--border-hover)]">
          <EmptyState 
            icon="📈"
            title="No History Logs Registered"
            message="Your progress line charts and diagnostic summary cards will render once you generate body scans."
          />
        </div>
      ) : (
        <div className="fade-up d2 flex flex-col gap-6 mt-2">
          
          {/* BMI Progression */}
          <div className="glass p-5 sm:p-6 hover:border-[var(--border-hover)]">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">📈</span>
              <span className="font-syne font-bold text-[15px] text-[var(--text-primary)]">BMI Progression Trend</span>
            </div>
            
            {bmiData.length > 1 ? (
              <div className="w-full h-[320px] min-w-0 mt-4">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={bmiData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10.5, fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: "var(--text-muted)", fontSize: 10.5, fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="bmi" 
                      stroke="var(--cyan)" 
                      strokeWidth={3} 
                      dot={{ r: 3, fill: "var(--bg-base)", stroke: "var(--cyan)", strokeWidth: 2 }} 
                      activeDot={{ r: 5 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState 
                icon="📊" 
                title="Trend Pending Data" 
                message="Need at least 2 separate body metrics analysis runs to map a progression curve." 
              />
            )}
          </div>

          {/* Past Analysis list */}
          <div className="glass p-5 sm:p-6 hover:border-[var(--border-hover)]">
            <SectionTitle>Past Diagnostic Records</SectionTitle>
            <div className="flex flex-col gap-3 mt-4">
              {history.map((item, idx) => (
                <div key={idx} className="p-4 bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-xl hover:bg-[var(--bg-surface-hover)] transition-all duration-200">
                  <div className="flex justify-between items-center mb-2.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--text-primary)] capitalize">{item.type} Diagnosis</span>
                      <span className={`badge ${getBadgeClass(item.type)} text-[8.5px]`}>{item.type}</span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] font-mono font-medium">{new Date(item.date).toLocaleDateString("en-IN", { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="m-0 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                    {item.data?.insight || "Diagnostic details scanned correctly."}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
