import { useEffect, useState } from "react";

const tips = [
  "Your BMI trend is improving. Maintaining current activity levels will help reach your optimal range within 6–8 weeks.",
  "Sleep consistency is the #1 lever for recovery. Aim for the same bedtime every night to boost your lifestyle score.",
  "Hydration directly impacts skin clarity. Try reaching 8 glasses before 6 PM for best absorption.",
  "Your body score suggests a moderate-intensity cardio session today would be optimal — 30 mins, zone 2.",
  "Protein intake matters most post-workout. A meal within 45 minutes helps muscle synthesis significantly.",
];

export default function InsightCard({ insight, loading }) {
  const [displayed, setDisplayed] = useState(insight || tips[0]);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (insight) { setFade(false); setTimeout(() => { setDisplayed(insight); setFade(true); }, 220); return; }
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setDisplayed((prev) => {
          const i = tips.indexOf(prev);
          return tips[(i + 1) % tips.length];
        });
        setFade(true);
      }, 220);
    }, 6000);
    return () => clearInterval(id);
  }, [insight]);

  return (
    <div
      className="glass glass-glow insight-glow"
      style={{ padding: "28px 28px 24px", position: "relative", overflow: "hidden" }}
    >
      {/* background decoration */}
      <div style={{
        position: "absolute", top: -40, right: -40, width: 160, height: 160,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(0,229,190,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, rgba(0,229,190,0.2), rgba(14,165,233,0.2))",
          border: "1px solid rgba(0,229,190,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          animation: "float 3s ease-in-out infinite",
        }}>🧠</div>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
            AI Health Insight
          </div>
          <div className="section-label" style={{ marginTop: 2 }}>Powered by Gemini</div>
        </div>
        <span className="badge badge-cyan" style={{ marginLeft: "auto" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--cyan)", animation: "pulse 1.8s ease-in-out infinite" }} />
          Live
        </span>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton" style={{ height: 14, width: "90%", borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 14, width: "70%", borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 14, width: "80%", borderRadius: 6 }} />
        </div>
      ) : (
        <p style={{
          margin: 0, fontSize: 14, lineHeight: 1.7,
          color: "var(--text-secondary)",
          opacity: fade ? 1 : 0,
          transition: "opacity 0.22s ease",
        }}>
          "{displayed}"
        </p>
      )}

      <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["Nutrition", "Recovery", "Lifestyle"].map((tag) => (
          <span key={tag} className="badge badge-cyan" style={{ fontSize: 10 }}>{tag}</span>
        ))}
      </div>
    </div>
  );
}
