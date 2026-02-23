import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { apiService } from "../services/api";
import CustomNode from "../components/Node";
import ERNode from "../components/ERNode";
import TableNode from "../components/TableNode";
import GroupNode from "../components/GroupNode";
import CustomEdge from "../components/CustomEdge";
import ERRelationshipEdge from "../components/ERRelationshipEdge";
import SEO from "../components/SEO";
import type { ValidationResult } from "../types/systemDesign";

// ---------------------------------------------------------------------------
// Constants mirrored from InspectorPanel
// ---------------------------------------------------------------------------

const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const DISPLAY_GROUPS: { label: string; keys: string[] }[] = [
  { label: "Scalability",     keys: ["scalability"] },
  { label: "Reliability",     keys: ["reliability"] },
  { label: "Security",        keys: ["security"] },
  { label: "Maintainability", keys: ["maintainability"] },
  { label: "Performance",     keys: ["performance"] },
  { label: "Operations",      keys: ["cost_efficiency", "observability", "deliverability"] },
  { label: "Alignment",       keys: ["requirements_alignment", "constraint_compliance"] },
  { label: "Documentation",   keys: ["component_justification", "connection_clarity"] },
];

const DIM_LABELS: Record<string, string> = {
  scalability: "Scalability",
  reliability: "Reliability",
  security: "Security",
  maintainability: "Maintainability",
  performance: "Performance",
  cost_efficiency: "Cost Efficiency",
  observability: "Observability",
  deliverability: "Deliverability",
  requirements_alignment: "Requirements",
  constraint_compliance: "Constraints",
  component_justification: "Components",
  connection_clarity: "Connections",
};

const FEEDBACK_TYPE_ICON: Record<string, string> = {
  success: "✅",
  warning: "⚠️",
  error: "❌",
  info: "ℹ️",
};

const FEEDBACK_TYPE_BORDER: Record<string, string> = {
  success: "border-green-500/50",
  warning: "border-amber-400/50",
  error: "border-red-500/50",
  info: "border-[var(--brand)]/50",
};

const scoreColor = (v: number) => {
  if (v >= 75) return "#22c55e";
  if (v >= 50) return "#f59e0b";
  return "#ef4444";
};

// ---------------------------------------------------------------------------
// Read-only node wrappers (disable copy / drag interactions)
// ---------------------------------------------------------------------------

const noop = () => {};

/* eslint-disable @typescript-eslint/no-explicit-any */
const ReadOnlyCustomNode = (props: any) => (
  <CustomNode {...props} onCopy={noop} isInGroup={false} />
);
const ReadOnlyERNode = (props: any) => (
  <ERNode {...props} onCopy={noop} isInGroup={false} />
);
const ReadOnlyTableNode = (props: any) => (
  <TableNode {...props} onCopy={noop} isInGroup={false} />
);
/* eslint-enable @typescript-eslint/no-explicit-any */

const NODE_TYPES = {
  custom: ReadOnlyCustomNode,
  erNode: ReadOnlyERNode,
  tableNode: ReadOnlyTableNode,
  group: GroupNode,
};

const EDGE_TYPES = {
  customEdge: CustomEdge,
  erRelationship: ERRelationshipEdge,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

interface AttemptPublicData {
  kind: "attempt";
  id: string;
  title: string;
  difficulty?: string;
  category?: string;
  problemId: string;
  nodes: Node[];
  edges: Edge[];
  lastAssessment?: ValidationResult | null;
  authorName?: string | null;
  authorPicture?: string | null;
  publishedAt?: string | null;
  viewCount: number;
}

interface DiagramPublicData {
  kind: "diagram";
  id: string;
  title: string;
  description?: string | null;
  nodes: Node[];
  edges: Edge[];
  authorName?: string | null;
  authorPicture?: string | null;
  publishedAt?: string | null;
  viewCount: number;
}

type PublicData = AttemptPublicData | DiagramPublicData;

// ---------------------------------------------------------------------------
// Assessment panel — mirrors InspectorPanel's assessment tab exactly
// ---------------------------------------------------------------------------

const AssessmentPanel: React.FC<{ assessment: ValidationResult }> = ({ assessment }) => (
  <div className="space-y-4">
    {/* Score header */}
    <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--surface)] flex items-center gap-4">
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={RING_RADIUS} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle
            cx="32" cy="32" r={RING_RADIUS} fill="none"
            stroke={scoreColor(assessment.score)}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${(assessment.score / 100) * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-theme">
          {assessment.score}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-theme text-base">Assessment Score</div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            assessment.isValid ? "bg-green-500/15 text-green-500" : "bg-amber-500/15 text-amber-500"
          }`}>
            {assessment.isValid ? "✅ Pass" : "⚠️ Needs Work"}
          </span>
        </div>
        {assessment.processingTimeMs && (
          <div className="text-[10px] text-muted mt-1">
            Analysed in {(assessment.processingTimeMs / 1000).toFixed(1)}s
          </div>
        )}
      </div>
    </div>

    {/* Score breakdown */}
    {assessment.scores && (
      <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--surface)] space-y-3">
        <div className="font-semibold text-theme text-sm flex items-center gap-2">
          <span>📊</span><span>Score Breakdown</span>
        </div>
        {DISPLAY_GROUPS.map(({ label, keys }) => {
          const s = assessment.scores as unknown as Record<string, number | undefined>;
          const vals = keys.map(k => s[k]).filter((v): v is number => v != null);
          if (vals.length === 0) return null;
          const val = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
          const color = scoreColor(val);
          const subtitle = keys.length > 1 ? keys.map(k => DIM_LABELS[k] ?? k).join(" · ") : null;
          return (
            <div key={label}>
              <div className="flex justify-between items-center mb-1">
                <div>
                  <span className="text-xs text-muted">{label}</span>
                  {subtitle && <span className="text-[10px] text-muted/50 ml-1.5">{subtitle}</span>}
                </div>
                <span className="text-xs font-semibold" style={{ color }}>{val}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, backgroundColor: color }} />
              </div>
            </div>
          );
        })}
      </div>
    )}

    {/* What went well */}
    {assessment.architectureStrengths.length > 0 && (
      <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--surface)]">
        <div className="font-semibold text-theme text-sm mb-3 flex items-center gap-2">
          <span className="text-green-500">✓</span><span>What Went Well</span>
        </div>
        <ul className="space-y-1.5">
          {assessment.architectureStrengths.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
              <span className="text-theme">{s}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Where to improve */}
    {(assessment.improvements.length > 0 || (assessment.suggestions && assessment.suggestions.length > 0)) && (
      <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--surface)]">
        <div className="font-semibold text-theme text-sm mb-3 flex items-center gap-2">
          <span className="text-orange-500">↑</span><span>Where to Improve</span>
        </div>
        {assessment.improvements.length > 0 && (
          <ul className="space-y-1.5 mb-3">
            {assessment.improvements.map((imp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>
                <span className="text-theme">{imp}</span>
              </li>
            ))}
          </ul>
        )}
        {assessment.suggestions && assessment.suggestions.length > 0 && (
          <>
            <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">Suggestions</div>
            <ul className="space-y-1.5">
              {assessment.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-[var(--brand)] mt-0.5 flex-shrink-0">→</span>
                  <span className="text-muted">{s}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    )}

    {/* Analysis & Feedback */}
    {((assessment.detailedAnalysis && Object.keys(assessment.detailedAnalysis).length > 0) ||
      assessment.feedback.length > 0) && (() => {
      const feedbackByCategory: Record<string, ValidationResult["feedback"]> = {};
      const uncategorised: ValidationResult["feedback"] = [];
      for (const fb of assessment.feedback) {
        if (assessment.detailedAnalysis?.[fb.category]) {
          feedbackByCategory[fb.category] ??= [];
          feedbackByCategory[fb.category].push(fb);
        } else {
          uncategorised.push(fb);
        }
      }
      return (
        <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--surface)] space-y-4">
          <div className="font-semibold text-theme text-sm flex items-center gap-2">
            <span>🔍</span><span>Analysis &amp; Feedback</span>
          </div>
          {assessment.detailedAnalysis &&
            Object.entries(assessment.detailedAnalysis).map(([dim, text]) => {
              if (!text) return null;
              const dimFeedback = feedbackByCategory[dim] ?? [];
              return (
                <div key={dim} className="space-y-1.5">
                  <div className="text-[10px] font-bold text-[var(--brand)] uppercase tracking-widest">
                    {DIM_LABELS[dim] ?? dim}
                  </div>
                  <div className="text-xs text-theme leading-relaxed pl-2 border-l-2 border-[var(--brand)]/30">{text}</div>
                  {dimFeedback.map((f, i) => (
                    <div key={i} className={`flex items-start gap-1.5 pl-2 border-l-2 ${FEEDBACK_TYPE_BORDER[f.type] ?? "border-[var(--brand)]/50"}`}>
                      <span className="text-[10px] mt-0.5 flex-shrink-0">{FEEDBACK_TYPE_ICON[f.type]}</span>
                      <span className="text-xs text-theme leading-relaxed">{f.message}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          {uncategorised.map((f, i) => (
            <div key={i} className={`flex items-start gap-1.5 pl-2 border-l-2 ${FEEDBACK_TYPE_BORDER[f.type] ?? "border-[var(--brand)]/50"}`}>
              <span className="text-[10px] mt-0.5 flex-shrink-0">{FEEDBACK_TYPE_ICON[f.type]}</span>
              <span className="text-xs text-theme leading-relaxed">{f.message}</span>
            </div>
          ))}
        </div>
      );
    })()}
  </div>
);

// ---------------------------------------------------------------------------
// Inner canvas (must be inside ReactFlowProvider)
// ---------------------------------------------------------------------------

const ReadOnlyCanvas: React.FC<{ nodes: Node[]; edges: Edge[] }> = ({
  nodes,
  edges,
}) => (
  <ReactFlow
    nodes={nodes}
    edges={edges}
    nodeTypes={NODE_TYPES}
    edgeTypes={EDGE_TYPES}
    nodesDraggable={false}
    nodesConnectable={false}
    elementsSelectable={false}
    panOnDrag
    zoomOnScroll
    zoomOnPinch
    fitView
    fitViewOptions={{ padding: 0.15 }}
    proOptions={{ hideAttribution: true }}
  >
    <Background gap={20} size={1} color="var(--border)" />
    <Controls showInteractive={false} />
    <MiniMap
      nodeStrokeWidth={3}
      zoomable
      pannable
      className="!bottom-4 !right-4"
    />
  </ReactFlow>
);

// ---------------------------------------------------------------------------
// Right panel — mirrors playground InspectorPanel look (no ScoreRing)
// ---------------------------------------------------------------------------

const RightPanel: React.FC<{ data: PublicData }> = ({ data }) => {
  const assessment =
    data.kind === "attempt" ? (data.lastAssessment ?? null) : null;
  const ctaTo =
    data.kind === "attempt" ? `/playground/${data.problemId}` : "/playground/free";
  const ctaText =
    data.kind === "attempt" ? "Try this problem →" : "Try by yourself →";

  return (
    <aside className="w-80 flex-shrink-0 h-full border-l border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden">
      {/* Header band */}
      <div className="bg-[var(--share-bg)] text-[var(--share-text)] px-5 py-4 flex-shrink-0">
        <p className="text-[color:var(--share-text)]/60 text-[10px] font-semibold uppercase tracking-widest mb-2">
          {data.kind === "attempt" ? "Public Solution" : "Shared Design"}
        </p>
        <h1 className="text-[color:var(--share-text)] font-bold text-base leading-snug">
          {data.title}
        </h1>
        {data.kind === "attempt" && (data.difficulty || data.category) && (
          <div className="flex items-center gap-2 mt-1.5">
            {data.difficulty && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[color:var(--share-text)]/80 font-medium">
                {data.difficulty}
              </span>
            )}
            {data.category && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[color:var(--share-text)]/80 font-medium">
                {data.category}
              </span>
            )}
          </div>
        )}
        {data.kind === "diagram" && data.description && (
          <p className="text-[color:var(--share-text)]/70 text-xs mt-1.5 leading-relaxed">
            {data.description}
          </p>
        )}
      </div>

      {/* Author row */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b border-[var(--border)]">
        {data.authorPicture ? (
          <img
            src={data.authorPicture}
            alt={data.authorName ?? "Author"}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--brand,#6366f1)]/15 flex items-center justify-center flex-shrink-0 text-[var(--brand,#6366f1)] font-bold text-sm">
            {(data.authorName ?? "A")[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-theme truncate">
            {data.authorName ?? "Anonymous"}
          </p>
          {data.publishedAt && (
            <p className="text-xs text-muted">{formatDate(data.publishedAt)}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-semibold text-theme">{data.viewCount}</p>
          <p className="text-[10px] text-muted">views</p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {assessment ? (
          <AssessmentPanel assessment={assessment} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <span className="text-4xl mb-3">🎨</span>
            <p className="text-theme font-semibold text-sm mb-1">Free Design</p>
            <p className="text-muted text-xs leading-relaxed max-w-[200px]">
              This is a shared canvas with no assessment. Try building your own!
            </p>
          </div>
        )}
      </div>

      {/* CTA footer */}
      <div className="flex-shrink-0 border-t border-[var(--border)] px-4 py-3">
        <Link
          to={ctaTo}
          className="block w-full text-center py-2.5 rounded-xl bg-[var(--brand,#6366f1)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {ctaText}
        </Link>
      </div>
    </aside>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const SharedCanvasPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reconstruct composite id if hash was not URL-encoded (legacy broken links)
  const resolvedId = useMemo(() => {
    if (!id) return id;
    const fragment = globalThis.location.hash.replace(/^#/, "");
    return fragment ? `${id}#${fragment}` : id;
  }, [id]);

  useEffect(() => {
    if (!resolvedId) {
      setError("Invalid link.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const isAttempt = resolvedId.includes("#");

    const req = isAttempt
          ? apiService.getPublicSolution(resolvedId).then((res) => ({
          kind: "attempt" as const,
          id: res.id,
          title: res.title,
          difficulty: res.difficulty,
          category: res.category,
          problemId: res.problemId,
          nodes: res.nodes as Node[],
          edges: res.edges as Edge[],
          lastAssessment:
            res.lastAssessment == null
              ? null
              : (res.lastAssessment as unknown as ValidationResult),
          authorName: res.authorName,
          authorPicture: res.authorPicture,
          publishedAt: res.publishedAt,
          viewCount: res.viewCount,
        }))
      : apiService.getPublicDiagramData(resolvedId).then((res) => ({
          kind: "diagram" as const,
          id: res.id,
          title: res.title,
          description: res.description,
          nodes: res.nodes as Node[],
          edges: res.edges as Edge[],
          authorName: res.authorName,
          authorPicture: res.authorPicture,
          publishedAt: res.publishedAt,
          viewCount: res.viewCount,
        }));

    req
      .then(setData)
      .catch(() =>
        setError("This design is not available or has been unpublished.")
      )
      .finally(() => setLoading(false));
  }, [resolvedId]);

  const nodes = useMemo(() => data?.nodes ?? [], [data]);
  const edges = useMemo(() => data?.edges ?? [], [data]);

  const pageTitle = data
    ? `${data.title} — Diagrammatic`
    : "Shared Design — Diagrammatic";

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--brand,#6366f1)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted text-sm">Loading design…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14" />
            </svg>
          </div>
          <h2 className="text-theme font-bold text-lg mb-2">Design unavailable</h2>
          <p className="text-muted text-sm mb-6">
            {error ?? "This design is not available or has been unpublished."}
          </p>
          <Link
            to="/"
            className="inline-block px-5 py-2 rounded-xl bg-[var(--brand,#6366f1)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Diagrammatic
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={pageTitle}
        description={
          data.kind === "attempt"
            ? `Check out this system design solution for "${data.title}" on Diagrammatic.`
            : `Check out this interactive diagram "${data.title}" on Diagrammatic.`
        }
      />

      <div className="h-screen flex flex-col bg-[var(--bg)] overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex-shrink-0 h-12">
          <Link
            to="/"
            className="font-bold text-sm text-theme hover:opacity-80 transition-opacity"
          >
            Diagrammatic
          </Link>
          <span className="text-muted text-sm">/</span>
          <span className="text-theme text-sm font-medium truncate max-w-xs">
            {data.title}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted px-2 py-1 rounded-full bg-[var(--bg)] border border-[var(--border)]">
              Read-only
            </span>
          </div>
        </header>

        {/* Body: canvas + sidebar */}
        <div className="flex flex-1 min-h-0">
          {/* Canvas */}
          <div className="flex-1 min-w-0 h-full">
            <ReactFlowProvider>
              <ReadOnlyCanvas nodes={nodes} edges={edges} />
            </ReactFlowProvider>
          </div>

          {/* Right panel */}
          <RightPanel data={data} />
        </div>
      </div>
    </>
  );
};

export default SharedCanvasPage;
