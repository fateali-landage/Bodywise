import { useState } from "react";
import { Link } from "react-router-dom";
import { useBodyWise } from "../context/BodyWiseContext";
import {
  EmptyState,
  PageHeader,
  ResultBox,
  ScoreRing,
  SectionHeader,
  SectionTitle,
} from "../components/ui";

export default function ResultsPage() {
  const { result, scores } = useBodyWise();
  const hasAny = result.body || result.skin || result.lifestyle || result.food;

  // Toggle detail states
  const [showBodyDetails, setShowBodyDetails] = useState(true);
  const [showSkinDetails, setShowSkinDetails] = useState(true);
  const [showLifestyleDetails, setShowLifestyleDetails] = useState(true);

  // Simulated actions feedback
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setDownloadSuccess(false);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
      
      // Simulate standard PDF trigger
      window.print();
    }, 1200);
  };

  const handleShare = () => {
    setSharing(true);
    setShareSuccess(false);
    setTimeout(() => {
      setSharing(false);
      setShareSuccess(true);
      navigator.clipboard.writeText(window.location.href);
      setTimeout(() => setShareSuccess(false), 2500);
    }, 800);
  };

  // Helper to determine severity color
  const getSeverityBadge = (status) => {
    if (!status) return null;
    const lower = status.toLowerCase();
    if (lower.includes("healthy") || lower.includes("normal")) {
      return <span className="badge badge-emerald text-[9px]">Healthy</span>;
    }
    if (lower.includes("mild") || lower.includes("overweight")) {
      return <span className="badge badge-amber text-[9px]">Moderate</span>;
    }
    return <span className="badge badge-cyan text-[9px]">Low Risk</span>;
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Analysis Report"
        description="A consolidated medical-grade snapshot of your body metrics, skin health scan and lifestyle score."
        actions={
          hasAny ? (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button 
                onClick={handleDownload} 
                disabled={downloading}
                className="btn btn-ghost text-xs h-10 px-4 w-full sm:w-auto flex items-center justify-center gap-1.5"
              >
                {downloading ? "Generating PDF..." : downloadSuccess ? "Report Downloaded! ✔" : "📥 Download PDF"}
              </button>
              <button 
                onClick={handleShare} 
                disabled={sharing}
                className="btn btn-ghost text-xs h-10 px-4 w-full sm:w-auto flex items-center justify-center gap-1.5"
              >
                {sharing ? "Copying Link..." : shareSuccess ? "Link Copied! ✔" : "🔗 Share Link"}
              </button>
              <Link to="/analyze" className="btn btn-cyan text-xs h-10 px-5 w-full sm:w-auto flex items-center justify-center no-underline" style={{ marginTop: 0 }}>
                Run New Scan
              </Link>
            </div>
          ) : null
        }
      />

      {!hasAny ? (
        <div className="fade-up glass p-8 sm:p-12 text-center hover:border-[var(--border-hover)]">
          <EmptyState 
            icon="📊"
            title="No Results Scanned Yet"
            message="Provide your body parameters and upload a skin picture to generate a comprehensive report."
            action={
              <Link to="/analyze" className="btn btn-cyan text-xs h-10 px-5 inline-flex justify-center items-center no-underline mt-2">
                Start Health Scan →
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <SectionTitle>Summary Metrics</SectionTitle>
          <section className="fade-up d1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <ScoreRing
              value={scores.bodyScore}
              label="Body Score"
              icon="🫀"
              color="var(--cyan)"
              trackColor="var(--cyan-dim)"
              glowColor="var(--cyan)"
            />
            <ScoreRing
              value={scores.skinScore}
              label="Skin Score"
              icon="✨"
              color="var(--violet)"
              trackColor="var(--violet-dim)"
              glowColor="var(--violet)"
            />
            <ScoreRing
              value={scores.lifestyleScore}
              label="Lifestyle Score"
              icon="🌿"
              color="var(--emerald)"
              trackColor="var(--emerald-dim)"
              glowColor="var(--emerald)"
            />
          </section>

          {/* ── Body Report ── */}
          <SectionTitle>Biometric Parameters</SectionTitle>
          <div className="fade-up d2 glass hover:border-[var(--border-hover)]">
            <div 
              className="p-5 flex items-center justify-between cursor-pointer border-b border-[var(--border)] select-none"
              onClick={() => setShowBodyDetails(!showBodyDetails)}
            >
              <SectionHeader icon="🫀" title="Body Biometrics Analysis" badge="BMI Details" badgeColor="cyan" />
              <button className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer text-lg font-bold">
                {showBodyDetails ? "▲" : "▼"}
              </button>
            </div>
            
            {showBodyDetails && (
              <div className="p-5 sm:p-6 bg-[var(--bg-surface-2)]">
                {result.body ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">⚖️</span>
                        <div>
                          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Body Mass Index</div>
                          <div className="font-syne font-extrabold text-2xl mt-1 text-[var(--cyan)]">{result.body.bmi}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-secondary)] font-medium">Category Status:</span>
                        {getSeverityBadge(result.body.status)}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] mt-2">
                      <div className="font-syne font-bold text-sm text-[var(--text-primary)] mb-2">Primary Diagnosis</div>
                      <p className="m-0 text-sm leading-relaxed text-[var(--text-secondary)]">{result.body.insight}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] mt-2">
                      <div className="font-syne font-bold text-sm text-[var(--text-primary)] mb-3">Actionable Recommendations</div>
                      <ul className="m-0 pl-5 text-[13.5px] text-[var(--text-secondary)] space-y-2 leading-relaxed list-disc">
                        {result.body.recommendations?.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    {result.prediction && (
                      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] mt-2 flex flex-col gap-2">
                        <div className="font-syne font-bold text-sm text-[var(--text-primary)] mb-1">Health Trends Prediction</div>
                        <div className="text-[13px] text-[var(--text-secondary)] flex items-center gap-2">
                          <span>📈 Weight Progression:</span>
                          <span className="font-semibold text-[var(--cyan)]">{result.prediction.weightTrend}</span>
                        </div>
                        <div className="text-[13px] text-[var(--text-secondary)] flex items-center gap-2">
                          <span>🛡️ Future Skin Condition Risk:</span>
                          <span className="badge badge-amber text-[10px]">{result.prediction.skinConditionRisk}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyState icon="🫀" title="No Body Analysis" message="Execute a body health analysis on the scan page to populate detailed biometrics." />
                )}
              </div>
            )}
          </div>

          {/* ── Skin Report ── */}
          <SectionTitle>Dermatological Signals</SectionTitle>
          <div className="fade-up d3 glass hover:border-[var(--border-hover)]">
            <div 
              className="p-5 flex items-center justify-between cursor-pointer border-b border-[var(--border)] select-none"
              onClick={() => setShowSkinDetails(!showSkinDetails)}
            >
              <SectionHeader icon="✨" title="Skin Scan Analysis" badge="Dermatology Vision" badgeColor="violet" />
              <button className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer text-lg font-bold">
                {showSkinDetails ? "▲" : "▼"}
              </button>
            </div>
            
            {showSkinDetails && (
              <div className="p-5 sm:p-6 bg-[var(--bg-surface-2)]">
                {result.skin ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📸</span>
                        <div>
                          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Detected Dermatological Signals</div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {result.skin.detected.map((d) => (
                              <span key={d} className="badge badge-violet text-[10px]">{d}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-secondary)] font-medium">Concern Severity:</span>
                        <span className="badge badge-amber text-[10px]">{result.skin.concernLevel || "Low"}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] mt-2">
                      <div className="font-syne font-bold text-sm text-[var(--text-primary)] mb-2">Dermatology Assessment</div>
                      <p className="m-0 text-sm leading-relaxed text-[var(--text-secondary)]">{result.skin.insight}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] mt-2">
                      <div className="font-syne font-bold text-sm text-[var(--text-primary)] mb-3">Skin Care suggestions</div>
                      <ul className="m-0 pl-5 text-[13.5px] text-[var(--text-secondary)] space-y-2 leading-relaxed list-disc">
                        {result.skin.suggestions?.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon="✨" title="No Skin Scan Analysis" message="Upload a skin photo on the scan page to populate dermatology vision diagnostics." />
                )}
              </div>
            )}
          </div>

          {/* ── Lifestyle Report ── */}
          <SectionTitle>Lifestyle & Habits</SectionTitle>
          <div className="fade-up d4 glass hover:border-[var(--border-hover)]">
            <div 
              className="p-5 flex items-center justify-between cursor-pointer border-b border-[var(--border)] select-none"
              onClick={() => setShowLifestyleDetails(!showLifestyleDetails)}
            >
              <SectionHeader icon="🌿" title="Habit & Sleep Analysis" badge="Recovery Diagnostics" badgeColor="amber" />
              <button className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer text-lg font-bold">
                {showLifestyleDetails ? "▲" : "▼"}
              </button>
            </div>
            
            {showLifestyleDetails && (
              <div className="p-5 sm:p-6 bg-[var(--bg-surface-2)]">
                {result.lifestyle ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🛌</span>
                        <div>
                          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Lifestyle Recovery Index</div>
                          <div className="font-syne font-extrabold text-2xl mt-1 text-[var(--amber)]">{result.lifestyle.lifestyleScore} / 100</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-secondary)] font-medium">Status:</span>
                        <span className="badge badge-emerald text-[10px]">Healthy</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] mt-2">
                      <div className="font-syne font-bold text-sm text-[var(--text-primary)] mb-2">Habits Overview</div>
                      <p className="m-0 text-sm leading-relaxed text-[var(--text-secondary)]">{result.lifestyle.insight}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] mt-2">
                      <div className="font-syne font-bold text-sm text-[var(--text-primary)] mb-3">Diagnostic Explanations</div>
                      <ul className="m-0 pl-5 text-[13.5px] text-[var(--text-secondary)] space-y-2 leading-relaxed list-disc">
                        {result.lifestyle.explanations?.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon="🌿" title="No Lifestyle Diagnostics" message="Execute a lifestyle analyzer run on the scan page to populate sleep and recovery reports." />
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
