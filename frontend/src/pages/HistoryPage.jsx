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

      {error && <div style={{ color: "var(--red)", marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
      ) : history.length === 0 ? (
        <div className="glass" style={{ padding: 24, marginTop: 24 }}>
          <h2 className="display" style={{ fontSize: 18, marginBottom: 16 }}>Trends coming soon</h2>
          <EmptyState message="You don't have enough data to display historical trends yet." />
        </div>
      ) : (
        <div className="fade-up d2" style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 24 }}>
          
          <div className="glass" style={{ padding: 24 }}>
            <SectionTitle>BMI Progression</SectionTitle>
            {bmiData.length > 1 ? (
              <div style={{ height: 260, marginTop: 16 }}>
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

          <div className="glass" style={{ padding: 24 }}>
            <SectionTitle>Past Analysis Results</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {history.map((item, idx) => (
                <div key={idx} style={{ padding: 16, background: "var(--bg-surface)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ textTransform: "capitalize", fontWeight: 600, color: "var(--text-primary)" }}>{item.type} Analysis</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.date}</span>
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
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
