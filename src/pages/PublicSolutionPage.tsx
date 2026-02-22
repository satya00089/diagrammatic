import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiService } from "../services/api";
import SEO from "../components/SEO";

interface PublicSolutionData {
  id: string;
  problemId: string;
  title: string;
  difficulty?: string;
  category?: string;
  nodes: unknown[];
  edges: unknown[];
  lastAssessment: {
    score?: number;
    isValid?: boolean;
    architectureStrengths?: string[];
    improvements?: string[];
    feedback?: Array<{ category: string; message: string; type: string }>;
    suggestions?: string[];
    missingComponents?: string[];
  } | null;
  authorName: string | null;
  authorPicture: string | null;
  publishedAt: string | null;
  viewCount: number;
  elapsedTime: number;
}

const ScoreRing: React.FC<{ score: number; size?: number }> = ({
  score,
  size = 100,
}) => {
  const radius = (size / 2) * 0.78;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  let color = "#ef4444";
  if (score >= 80) color = "#10b981";
  else if (score >= 60) color = "#f59e0b";
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="-rotate-90"
        style={{ width: size, height: size }}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none" stroke="#e5e7eb"
          strokeWidth={size * 0.08}
        />
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none" stroke={color}
          strokeWidth={size * 0.08}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold leading-none" style={{ color, fontSize: size * 0.24 }}>
          {score}
        </span>
        <span className="text-gray-400 leading-none" style={{ fontSize: size * 0.1 }}>
          / 100
        </span>
      </div>
    </div>
  );
};

const formatDate = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

const PublicSolutionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [solution, setSolution] = useState<PublicSolutionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    apiService
      .getPublicSolution(id)
      .then((data) => {
        setSolution(data as unknown as PublicSolutionData);
      })
      .catch(() => {
        setError("This solution could not be found or is no longer public.");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--brand,#6366f1)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted text-sm">Loading solution…</p>
        </div>
      </div>
    );
  }

  if (error || !solution) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-theme mb-2">Solution Not Found</h1>
          <p className="text-muted text-sm mb-6">
            {error ?? "This solution doesn't exist or has been made private."}
          </p>
          <Link
            to="/problems"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[var(--brand,#6366f1)] to-purple-500 hover:opacity-90 transition-opacity"
          >
            Browse Problems
          </Link>
        </div>
      </div>
    );
  }

  const score = solution.lastAssessment?.score ?? 0;
  const isValid = solution.lastAssessment?.isValid ?? false;
  const strengths = solution.lastAssessment?.architectureStrengths ?? [];
  const improvements = solution.lastAssessment?.improvements ?? [];
  const feedback = solution.lastAssessment?.feedback ?? [];

  return (
    <>
      <SEO
        title={`${solution.title} — ${solution.authorName ?? "Anonymous"}'s Solution | Diagrammatic`}
        description={`Check out this ${score}/100 system design solution for ${solution.title} on Diagrammatic.`}
      />

      <div className="min-h-screen bg-[var(--bg)]">
        {/* Top nav strip */}
        <div className="border-b border-theme/10 bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-bold text-theme text-lg">
              <span className="text-2xl">⬡</span>
              <span>Diagrammatic</span>
            </Link>
            <Link
              to={`/playground/${solution.problemId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[var(--brand,#6366f1)] to-purple-500 hover:opacity-90 transition-opacity"
            >
              Try this problem →
            </Link>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
          {/* Hero card */}
          <div className="bg-surface rounded-2xl border border-theme/10 p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              {/* Author */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {solution.authorPicture ? (
                  <img
                    src={solution.authorPicture}
                    alt={solution.authorName ?? "Author"}
                    className="w-14 h-14 rounded-full object-cover border-2 border-theme/10"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--brand,#6366f1)] to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                    {(solution.authorName ?? "A")[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-theme">
                    {solution.authorName ?? "Anonymous"}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDate(solution.publishedAt)}
                  </p>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[var(--brand,#6366f1)] uppercase tracking-wide mb-1">
                  System Design
                </div>
                <h1 className="text-2xl font-bold text-theme leading-tight">
                  {solution.title}
                </h1>
                <p className="text-sm text-muted mt-1 flex items-center gap-3">
                  {isValid ? (
                    <span className="text-green-500 font-medium">✅ Passing solution</span>
                  ) : (
                    <span className="text-orange-400 font-medium">⚠️ Partial solution</span>
                  )}
                  <span>·</span>
                  <span>👁 {solution.viewCount.toLocaleString()} view{solution.viewCount === 1 ? "" : "s"}</span>
                </p>
              </div>

              <div className="flex-shrink-0">
                <ScoreRing score={score} size={100} />
              </div>
            </div>
          </div>

          {/* Architecture Strengths */}
          {strengths.length > 0 && (
            <div className="bg-surface rounded-2xl border border-theme/10 p-6 shadow-sm">
              <h2 className="font-semibold text-theme mb-4 flex items-center gap-2">
                <span className="text-green-500 text-lg" aria-hidden="true">✓</span>{" "}
                Architecture Strengths
              </h2>
              <ul className="space-y-2.5">
                {strengths.map((s) => (
                  <li key={s} className="flex items-start gap-2.5 text-sm">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-theme">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {improvements.length > 0 && (
            <div className="bg-surface rounded-2xl border border-theme/10 p-6 shadow-sm">
              <h2 className="font-semibold text-theme mb-4 flex items-center gap-2">
                <span className="text-orange-500 text-lg" aria-hidden="true">!</span>{" "}
                Areas to Improve
              </h2>
              <ul className="space-y-2.5">
                {improvements.map((imp) => (
                  <li key={imp} className="flex items-start gap-2.5 text-sm">
                    <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-theme">{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Feedback */}
          {feedback.length > 0 && (
            <div className="bg-surface rounded-2xl border border-theme/10 p-6 shadow-sm">
              <h2 className="font-semibold text-theme mb-4">Detailed Feedback</h2>
              <div className="space-y-3">
                {feedback.map((f) => (
                  <div
                    key={`${f.category}-${f.message}`}
                    className="border-l-2 border-[var(--brand,#6366f1)] pl-4 py-1"
                  >
                    <div className="text-xs font-semibold text-[var(--brand,#6366f1)] uppercase tracking-wide mb-0.5">
                      {f.category}
                    </div>
                    <div className="text-sm text-theme">{f.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-gradient-to-r from-[var(--brand,#6366f1)]/10 to-purple-500/10 rounded-2xl border border-[var(--brand,#6366f1)]/20 p-8 text-center">
            <h2 className="text-xl font-bold text-theme mb-2">Think you can do better?</h2>
            <p className="text-muted text-sm mb-6">
              Sign up and try <span className="font-semibold text-theme">"{solution.title}"</span> yourself. Get AI-powered feedback on your own solution.
            </p>
            <Link
              to={`/playground/${solution.problemId}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--brand,#6366f1)] to-purple-500 hover:opacity-90 transition-opacity"
            >
              Try this problem →
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-theme/10 mt-12 py-6 text-center">
          <p className="text-xs text-muted">
            Built with{" "}
            <a
              href="/"
              className="text-[var(--brand,#6366f1)] hover:underline"
            >
              Diagrammatic
            </a>{" "}
            — the interactive system design learning platform
          </p>
        </footer>
      </div>
    </>
  );
};

export default PublicSolutionPage;
