import React from "react";
import type {
  ReviewFinding,
  ReviewFindingSeverity,
} from "../types/systemDesign";

const SEVERITY_LABELS: Record<ReviewFindingSeverity, string> = {
  critical: "Critical",
  important: "Important",
  improvement: "Improvement",
  positive: "Positive",
};

const SEVERITY_STYLES: Record<ReviewFindingSeverity, string> = {
  critical: "border-red-500/40 bg-red-500/5",
  important: "border-amber-500/40 bg-amber-500/5",
  improvement: "border-[var(--brand)]/30 bg-[var(--brand)]/5",
  positive: "border-green-500/40 bg-green-500/5",
};

const SEVERITY_BADGE_STYLES: Record<ReviewFindingSeverity, string> = {
  critical: "bg-red-500/15 text-red-400",
  important: "bg-amber-500/15 text-amber-400",
  improvement: "bg-[var(--brand)]/15 text-[var(--brand)]",
  positive: "bg-green-500/15 text-green-400",
};

type AssessmentFindingsProps = {
  findings: ReviewFinding[];
};

const AssessmentFindings: React.FC<AssessmentFindingsProps> = ({ findings }) => {
  if (findings.length === 0) return null;

  return (
    <section
      className="p-4 border rounded-xl bg-[var(--surface)] space-y-3"
      aria-labelledby="assessment-findings-title"
    >
      <div>
        <h3
          id="assessment-findings-title"
          className="font-semibold text-theme text-sm"
        >
          Key findings
        </h3>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          The most important observations from this review, ordered for action.
        </p>
      </div>

      <div className="space-y-2.5">
        {findings.map((finding) => {
          const severity = finding.severity;
          return (
            <article
              key={`${finding.severity}:${finding.title}`}
              className={`rounded-lg border p-3 ${SEVERITY_STYLES[severity]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-theme leading-snug">
                  {finding.title}
                </h4>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${SEVERITY_BADGE_STYLES[severity]}`}
                >
                  {SEVERITY_LABELS[severity]}
                </span>
              </div>

              <div className="mt-2 space-y-2 text-xs leading-relaxed">
                <p className="text-theme">
                  <span className="font-semibold">Why it matters: </span>
                  {finding.explanation}
                </p>
                {finding.recommendation && (
                  <p className="text-theme">
                    <span className="font-semibold">Suggested improvement: </span>
                    {finding.recommendation}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default AssessmentFindings;
