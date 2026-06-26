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
    if (insight) { 
      setFade(false); 
      const t = setTimeout(() => { 
        setDisplayed(insight); 
        setFade(true); 
      }, 200); 
      return () => clearTimeout(t); 
    }
    
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setDisplayed((prev) => {
          const i = tips.indexOf(prev);
          return tips[(i + 1) % tips.length];
        });
        setFade(true);
      }, 200);
    }, 6500);
    
    return () => clearInterval(id);
  }, [insight]);

  return (
    <div className="glass glass-glow insight-glow p-5 sm:p-6 pb-5 relative overflow-hidden h-full flex flex-col justify-between hover:border-[var(--cyan)] transition-colors">
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{
        background: "radial-gradient(circle, var(--cyan-glow) 0%, transparent 70%)"
      }} />

      <div>
        <div className="flex items-center gap-2.5 mb-4 relative z-10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg animate-[float_3.5s_ease-in-out_infinite]" style={{
            background: "linear-gradient(135deg, rgba(0,229,190,0.15), rgba(167,139,250,0.15))",
            border: "1px solid rgba(0,229,190,0.25)",
          }}>🧠</div>
          <div>
            <div className="font-syne font-bold text-sm text-[var(--text-primary)]">
              AI Health Insight
            </div>
            <div className="section-label text-[9px] mt-0.5 tracking-widest">Powered by Gemini</div>
          </div>
          <span className="badge badge-cyan ml-auto text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-[pulse_1.8s_ease-in-out_infinite]" />
            Live
          </span>
        </div>

        <div className="relative z-10 my-2">
          {loading ? (
            <div className="flex flex-col gap-2.5">
              <div className="skeleton h-3.5 w-full rounded" />
              <div className="skeleton h-3.5 w-[90%] rounded" />
              <div className="skeleton h-3.5 w-[75%] rounded" />
            </div>
          ) : (
            <p className={`m-0 text-[14px] leading-relaxed text-[var(--text-secondary)] transition-opacity duration-200 ${fade ? 'opacity-100' : 'opacity-0'} italic`}>
              "{displayed}"
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-1.5 flex-wrap relative z-10">
        {["Nutrition", "Recovery", "Lifestyle"].map((tag) => (
          <span key={tag} className="badge badge-cyan text-[9px] px-2 py-0.5 tracking-normal normal-case">{tag}</span>
        ))}
      </div>
    </div>
  );
}
