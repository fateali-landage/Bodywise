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
    <div className="glass glass-glow insight-glow p-6 sm:p-7 pb-6 relative overflow-hidden h-full flex flex-col">
      {/* background decoration */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{
        background: "radial-gradient(circle, rgba(0,229,190,0.08) 0%, transparent 70%)"
      }} />

      <div className="flex items-center gap-2.5 mb-4 relative z-10">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg animate-[float_3s_ease-in-out_infinite]" style={{
          background: "linear-gradient(135deg, rgba(0,229,190,0.2), rgba(14,165,233,0.2))",
          border: "1px solid rgba(0,229,190,0.3)",
        }}>🧠</div>
        <div>
          <div className="font-syne font-bold text-sm text-[var(--text-primary)]">
            AI Health Insight
          </div>
          <div className="section-label mt-0.5">Powered by Gemini</div>
        </div>
        <span className="badge badge-cyan ml-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-[pulse_1.8s_ease-in-out_infinite]" />
          Live
        </span>
      </div>

      <div className="flex-1 relative z-10">
        {loading ? (
          <div className="flex flex-col gap-2">
            <div className="skeleton h-3.5 w-[90%] rounded-md" />
            <div className="skeleton h-3.5 w-[70%] rounded-md" />
            <div className="skeleton h-3.5 w-[80%] rounded-md" />
          </div>
        ) : (
          <p className={`m-0 text-sm leading-relaxed text-[var(--text-secondary)] transition-opacity duration-200 ${fade ? 'opacity-100' : 'opacity-0'}`}>
            "{displayed}"
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-2 flex-wrap relative z-10">
        {["Nutrition", "Recovery", "Lifestyle"].map((tag) => (
          <span key={tag} className="badge badge-cyan text-[10px]">{tag}</span>
        ))}
      </div>
    </div>
  );
}
