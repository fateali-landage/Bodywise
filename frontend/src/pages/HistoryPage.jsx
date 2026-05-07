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
    date: item.date,
    bmi: item.data?.bmi
  })).filter(d => d.bmi);

  return (
    <div className="page-container">
      <PageHeader 
        eyebrow="Health History" 
        title="Your Progress" 
        description="Track your past analysis, calories, and BMI changes." 
      />

      {error && <div className="text-[var(--red)] mb-4">{error}</div>}

      {loading ? (
        <div className="flex justify-center p-10"><Spinner /></div>
      ) : history.length === 0 ? (
        <div className="glass p-6 mt-6">
          <h2 className="display text-lg mb-4">Trends coming soon</h2>
          <EmptyState message="You don't have enough data to display historical trends yet." />
        </div>
      ) : (
        <div className="fade-up d2 flex flex-col gap-6 mt-6">
          
          <div className="glass p-5 sm:p-6">
            <SectionTitle>BMI Progression</SectionTitle>
            {bmiData.length > 1 ? (
              <div className="w-full h-[400px] min-w-0 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bmiData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}
                      itemStyle={{ color: "var(--cyan)", fontWeight: 600 }}
                    />
                    <Line type="monotone" dataKey="bmi" stroke="var(--cyan)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="Need at least 2 body analyses to show a trend." />
            )}
          </div>

          <div className="glass p-5 sm:p-6">
            <SectionTitle>Past Analysis Results</SectionTitle>
            <div className="flex flex-col gap-3 mt-4">
              {history.map((item, idx) => (
                <div key={idx} className="p-4 bg-[var(--bg-surface)] rounded-[var(--radius-md)]">
                  <div className="flex justify-between mb-2">
                    <span className="capitalize font-semibold text-[var(--text-primary)]">{item.type} Analysis</span>
                    <span className="text-xs text-[var(--text-muted)]">{item.date}</span>
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {item.data?.insight || "No insight available."}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
