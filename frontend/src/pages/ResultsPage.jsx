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

  return (
    <>
      <PageHeader
        title="Results"
        description="A consolidated view of every analysis you've run in this session."
        actions={
          <Link to="/analyze" className="btn btn-cyan" style={{ marginTop: 0, textDecoration: "none" }}>
            Run new analysis
          </Link>
        }
      />

      {!hasAny ? (
        <div className="fade-up glass p-8 sm:p-12 text-center">
          <div className="text-[40px] mb-3">📊</div>
          <h3 className="display m-0 text-lg text-[var(--text-primary)]">
            No results yet
          </h3>
          <p className="my-2 mb-5 text-[13.5px] text-[var(--text-muted)]">
            Head over to the Analyze page to generate your first report.
          </p>
          <Link to="/analyze" className="btn btn-cyan mt-0 no-underline inline-flex justify-center w-full sm:w-auto">
            Go to Analyze →
          </Link>
        </div>
      ) : (
        <>
          <SectionTitle>Score Summary</SectionTitle>
          <section className="fade-up d1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            <ScoreRing
              value={scores.bodyScore}
              label="Body Score"
              icon="🫀"
              color="#00e5be"
              trackColor="rgba(0,229,190,0.10)"
              glowColor="rgba(0,229,190,0.5)"
            />
            <ScoreRing
              value={scores.skinScore}
              label="Skin Score"
              icon="✨"
              color="#a78bfa"
              trackColor="rgba(167,139,250,0.10)"
              glowColor="rgba(167,139,250,0.5)"
            />
            <ScoreRing
              value={scores.lifestyleScore}
              label="Lifestyle Score"
              icon="🌿"
              color="#34d399"
              trackColor="rgba(52,211,153,0.10)"
              glowColor="rgba(52,211,153,0.5)"
            />
          </section>

          <SectionTitle>Body & Skin</SectionTitle>
          <div className="fade-up d2 grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10 items-stretch">
            <div className="glass p-5 sm:p-6 flex flex-col h-full">
              <SectionHeader icon="🫀" title="Body Report" badge="BMI" badgeColor="cyan" />
              <div className="flex-1 mt-2">
                {result.body ? (
                  <ResultBox>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="badge badge-cyan mono">BMI {result.body.bmi}</span>
                      <span className="font-medium text-[var(--text-primary)]">{result.body.status}</span>
                    </div>
                    <p className="m-0 mb-2 text-[var(--text-secondary)]">{result.body.insight}</p>
                    <ul className="m-0 mt-2 pl-4 text-[12.5px] text-[var(--text-muted)] space-y-1">
                      {result.body.recommendations?.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                    {result.prediction && (
                      <div className="mt-3 pt-2.5 border-t border-[var(--border)] text-[12.5px] text-[var(--text-muted)]">
                        <span>📈 {result.prediction.weightTrend}</span>
                        <span className="mx-2">·</span>
                        <span>Skin risk: {result.prediction.skinConditionRisk}</span>
                      </div>
                    )}
                  </ResultBox>
                ) : (
                  <EmptyState message="No body analysis yet" />
                )}
              </div>
            </div>

            <div className="glass p-5 sm:p-6 flex flex-col h-full">
              <SectionHeader icon="✨" title="Skin Report" badge="Vision AI" badgeColor="violet" />
              <div className="flex-1 mt-2">
                {result.skin ? (
                  <ResultBox>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {result.skin.detected.map((d) => (
                        <span key={d} className="badge badge-violet">
                          {d}
                        </span>
                      ))}
                    </div>
                    <p className="m-0 mb-2 text-[var(--text-secondary)]">{result.skin.insight}</p>
                    <ul className="m-0 mt-2 pl-4 text-[12.5px] text-[var(--text-muted)] space-y-1">
                      {result.skin.suggestions?.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </ResultBox>
                ) : (
                  <EmptyState message="No skin analysis yet" />
                )}
              </div>
            </div>
          </div>

          <SectionTitle>Lifestyle & Nutrition</SectionTitle>
          <div className="fade-up d3 grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10 items-stretch">
            <div className="glass p-5 sm:p-6 flex flex-col h-full">
              <SectionHeader icon="🌿" title="Lifestyle Report" badge="Holistic" badgeColor="amber" />
              <div className="flex-1 mt-2">
                {result.lifestyle ? (
                  <ResultBox>
                    <div className="mb-2">
                      <span className="badge badge-amber mono">Score {result.lifestyle.lifestyleScore}</span>
                    </div>
                    <p className="m-0 mb-2 text-[var(--text-secondary)]">{result.lifestyle.insight}</p>
                    <ul className="m-0 mt-2 pl-4 text-[12.5px] text-[var(--text-muted)] space-y-1">
                      {result.lifestyle.explanations?.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </ResultBox>
                ) : (
                  <EmptyState message="No lifestyle analysis yet" />
                )}
              </div>
            </div>

            <div className="glass p-5 sm:p-6 flex flex-col h-full">
              <SectionHeader icon="🥗" title="Latest Meal" badge="Food AI" badgeColor="violet" />
              <div className="flex-1 mt-2">
                {result.food ? (
                  <ResultBox>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-semibold text-[var(--violet)]">{result.food.food}</span>
                      <span className="badge badge-cyan mono">{result.food.estimatedCalories} kcal</span>
                    </div>
                    <p className="m-0 text-[var(--text-secondary)]">{result.food.insight}</p>
                  </ResultBox>
                ) : (
                  <EmptyState message="No meal logged yet — try the Diet & Calories page" />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
