import React from "react";
import {
  PiDotsSixVerticalBold,
  PiCaretDownBold,
  PiCaretLeftBold,
  PiCaretRightBold,
} from "react-icons/pi";
import { MdAdd } from "react-icons/md";
import { FiShare2 } from "react-icons/fi";

// ── Assessment tab constants (defined once, not inside render) ──────────────
const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ~163.4

// Display groups for the Score Breakdown bars.
// Composite groups (multiple keys) show the average of their member scores.
const DISPLAY_GROUPS: { label: string; keys: string[] }[] = [
  { label: "Scalability",     keys: ["scalability"] },
  { label: "Reliability",     keys: ["reliability"] },
  { label: "Security",        keys: ["security"] },
  { label: "Maintainability", keys: ["maintainability"] },
  { label: "Performance",     keys: ["performance"] },
  // Composite: avg of cost_efficiency + observability + deliverability
  { label: "Operations",      keys: ["cost_efficiency", "observability", "deliverability"] },
  // Composite: avg of requirements_alignment + constraint_compliance
  { label: "Alignment",       keys: ["requirements_alignment", "constraint_compliance"] },
  // Composite: avg of component_justification + connection_clarity
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
// ────────────────────────────────────────────────────────────────────────────

type InspectorPanelProps = {
  problem: {
    id?: string;
    title: string;
    description: string;
    requirements: string[];
    constraints: string[];
    hints: string[];
    tags: string[];
  } | null;
  activeTab: "details" | "inspector" | "assessment";
  setActiveTab: (t: "details" | "inspector" | "assessment") => void;
  inspectedNodeId: string | null;
  setInspectedNodeId: (id: string | null) => void;
  inspectedEdgeId: string | null;
  setInspectedEdgeId: (id: string | null) => void;
  propertyElements: React.ReactNode;
  customPropertyElements: React.ReactNode;
  edgePropertyElements: React.ReactNode;
  onAddCustomProperty: () => void;
  handleSave: () => void;
  assessmentResult?: import("../types/systemDesign").ValidationResult | null;
  onDetachFromGroup?: () => void;
  isNodeInGroup?: boolean;
  onShareToWorld?: () => void;
};

const InspectorPanel: React.FC<InspectorPanelProps> = ({
  problem,
  activeTab,
  setActiveTab,
  inspectedNodeId,
  setInspectedNodeId,
  inspectedEdgeId,
  setInspectedEdgeId,
  propertyElements,
  customPropertyElements,
  edgePropertyElements,
  onAddCustomProperty,
  handleSave,
  assessmentResult,
  onDetachFromGroup,
  isNodeInGroup,
  onShareToWorld,
}) => {
  const [width, setWidth] = React.useState(320); // px
  const minWidth = 260;
  const maxWidth = 640;
  const resizingRef = React.useRef(false);
  const panelRef = React.useRef<HTMLElement | null>(null);
  const [showHints, setShowHints] = React.useState(false);
  const [open, setOpen] = React.useState(true);
  const [showInterviewQuestions, setShowInterviewQuestions] = React.useState(false);

  const scoreColor = (v: number) => {
    if (v >= 75) return "#22c55e";
    if (v >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const onMouseMove = React.useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;
    const next = Math.min(
      Math.max(window.innerWidth - e.clientX, minWidth),
      maxWidth,
    );
    setWidth(next);
  }, []);
  const stopResize = React.useCallback(() => {
    resizingRef.current = false;
    document.body.style.userSelect = "";
  }, []);
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = true;
    document.body.style.userSelect = "none";
  };
  React.useEffect(() => {
    globalThis.addEventListener("mousemove", onMouseMove);
    globalThis.addEventListener("mouseup", stopResize);
    return () => {
      globalThis.removeEventListener("mousemove", onMouseMove);
      globalThis.removeEventListener("mouseup", stopResize);
    };
  }, [onMouseMove, stopResize]);
  React.useEffect(() => {
    if (panelRef.current) {
      panelRef.current.style.width = width + "px";
    }
  }, [width]);

  // Auto-collapse panel in free design mode when no node is selected
  const isFreeDesignMode = problem?.id === "free";

  // Auto-collapse when neither node nor edge is selected in free design mode
  React.useEffect(() => {
    if (isFreeDesignMode && !inspectedNodeId && !inspectedEdgeId) {
      setOpen(false);
    }
  }, [isFreeDesignMode, inspectedNodeId, inspectedEdgeId]);

  // Auto-switch to inspector tab and expand when node or edge is selected in free design mode
  React.useEffect(() => {
    if (isFreeDesignMode && (inspectedNodeId || inspectedEdgeId)) {
      setActiveTab("inspector");
      setOpen(true);
    }
  }, [isFreeDesignMode, inspectedNodeId, inspectedEdgeId, setActiveTab]);

  if (!problem) return null;

  const copyAssessment = async () => {
    if (!assessmentResult) return;
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(assessmentResult, null, 2),
      );
    } catch {
      // clipboard API unavailable — silently skip
    }
  };

  const downloadAssessment = () => {
    if (!assessmentResult) return;
    const blob = new Blob([JSON.stringify(assessmentResult, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assessment-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative z-40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={
          open ? "Collapse inspector panel" : "Expand inspector panel"
        }
        aria-controls="inspector-panel"
        className="absolute top-5 -left-3 h-6 w-6 flex items-center justify-center rounded-full border border-theme bg-surface text-theme shadow cursor-pointer hover:bg-[var(--bg-hover)] transition-colors z-50"
      >
        {open ? <PiCaretRightBold size={16} /> : <PiCaretLeftBold size={16} />}
      </button>
      <aside
        ref={panelRef}
        id="inspector-panel"
        className={`bg-surface border-l border-theme flex flex-col h-full relative inspector-resizable transition-[width] duration-300 ease-in-out ${
          open ? "p-4" : "w-6 p-1"
        }`}
        data-width={width}
        style={{ width: open ? `${width}px` : "24px" }}
      >
        {open && (
          <>
            <button
              type="button"
              onMouseDown={onMouseDown}
              aria-label="Resize inspector panel"
              className="absolute left-0 top-0 h-full w-2 -ml-1 cursor-col-resize flex items-center justify-center group"
            >
              <span className="w-px h-full bg-transparent group-hover:bg-[var(--brand)]/40 transition-colors" />
              <PiDotsSixVerticalBold
                aria-hidden
                className="absolute py-1 rounded-md bg-[var(--surface)] border border-theme text-[var(--muted)] opacity-90 group-hover:bg-[var(--brand)] group-hover:text-white shadow-sm pointer-events-none transition-colors"
                size={24}
              />
            </button>

            {/* ── Share-to-World announcement bar — above the tabs ── */}
            {onShareToWorld &&
              assessmentResult &&
              (assessmentResult.isValid || assessmentResult.score >= 70) && (
                <button
                  type="button"
                  onClick={onShareToWorld}
                  className="w-[calc(100%+2rem)] flex items-center justify-center gap-2 -mx-4 -mt-4 px-3.5 py-1.5 mb-4
                    bg-[var(--announcement-bg)] text-[var(--announcement-text)] dark:bg-[var(--announcement-bg)] dark:text-[var(--announcement-text)] cursor-pointer text-sm font-medium
                    hover:opacity-90 active:scale-[.98] transition-all"
                >
                  <FiShare2 size={12} className="flex-shrink-0" />
                  <span className="font-semibold">Share your design</span>
                  {/* <span className="text-white/70 text-xs">— Share publicly: generate a link to showcase your design</span> */}
                </button>
              )}

            <div
              className="flex flex-wrap items-center justify-start gap-2"
              role="tablist"
              aria-label="Sidebar tabs"
            >
              {!isFreeDesignMode && (
                <button
                  type="button"
                  role="tab"
                  className={`flex items-center gap-2 px-3 py-2 rounded-t-md border-b-2 transition-colors ${activeTab === "details" ? "border-[var(--brand)] bg-[var(--brand)]/5 text-[var(--brand)]" : "border-transparent text-theme hover:bg-[var(--bg-hover)]"}`}
                  onClick={() => setActiveTab("details")}
                >
                  <span className="text-sm">📄</span>
                  <span className="text-sm font-medium">Details</span>
                </button>
              )}

              {!isFreeDesignMode && (
                <button
                  type="button"
                  role="tab"
                  className={`flex items-center gap-2 px-3 py-2 rounded-t-md border-b-2 transition-colors ${activeTab === "assessment" ? "border-[var(--brand)] bg-[var(--brand)]/5 text-[var(--brand)]" : "border-transparent text-theme hover:bg-[var(--bg-hover)]"}`}
                  onClick={() => setActiveTab("assessment")}
                >
                  <span className="text-sm">📊</span>
                  <span className="text-sm font-medium">Assessment</span>
                  {assessmentResult && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--brand)] text-white">
                      {assessmentResult.score}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                role="tab"
                className={`flex items-center gap-2 px-3 py-2 rounded-t-md border-b-2 transition-colors ${activeTab === "inspector" ? "border-[var(--brand)] bg-[var(--brand)]/5 text-[var(--brand)]" : "border-transparent text-theme hover:bg-[var(--bg-hover)]"}`}
                onClick={() => setActiveTab("inspector")}
              >
                <span className="text-sm">⚙️</span>
                <span className="text-sm font-medium">Properties</span>
              </button>
            </div>

            <div
              className="w-full h-px bg-[var(--muted)]/20 mb-4"
              aria-hidden="true"
            />

            {/* scrollable content area under the tabs */}
            <div className="overflow-y-auto component-palette flex-1">
              {activeTab === "details" && (
                <div>
                  <h3 className="text-lg font-semibold text-theme mb-3">
                    {problem.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed mb-4">
                    {problem.description}
                  </p>

                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-theme mb-2">
                      Requirements
                    </h4>
                    <ul className="space-y-1">
                      {problem.requirements.map((req) => (
                        <li key={req} className="flex items-start space-x-2">
                          <span className="text-green-500 mt-0.5 text-xs">
                            ✓
                          </span>
                          <span className="text-xs text-muted">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-theme mb-2">
                      Constraints
                    </h4>
                    <ul className="space-y-1">
                      {problem.constraints.map((constraint) => (
                        <li
                          key={constraint}
                          className="flex items-start space-x-2"
                        >
                          <span className="text-yellow-500 mt-0.5 text-xs">
                            ⚠
                          </span>
                          <span className="text-xs text-muted">
                            {constraint}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => setShowHints(!showHints)}
                      className="w-full flex items-center justify-between mb-2 cursor-pointer hover:bg-[var(--bg-hover)] p-2 rounded-md transition-colors"
                      aria-controls="hints-content"
                    >
                      <h4 className="text-sm font-semibold text-theme">
                        💡 Hints
                      </h4>
                      <PiCaretDownBold
                        size={14}
                        className={`text-muted transition-transform duration-150 ${
                          showHints ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </button>
                    {showHints && (
                      <div id="hints-content" className="space-y-2">
                        {problem.hints.map((hint) => (
                          <div
                            key={hint}
                            className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 dark:border-yellow-600 p-2 rounded-r-lg"
                          >
                            <div className="text-xs text-white">{hint}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-theme mb-2">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {problem.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "inspector" && (
                <div>
                  {/* ── EDGE INSPECTOR ── */}
                  {inspectedEdgeId && (
                    <div className="flex flex-col gap-0">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-base">🔗</span>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-theme leading-tight">Connection</h3>
                            <p className="text-[10px] text-muted font-mono truncate max-w-[140px]" title={inspectedEdgeId}>{inspectedEdgeId}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setInspectedEdgeId(null); setActiveTab("details"); }}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-muted hover:text-theme transition-colors cursor-pointer text-base"
                          title="Close"
                        >✕</button>
                      </div>

                      {edgePropertyElements && (
                        <div>{edgePropertyElements}</div>
                      )}
                    </div>
                  )}

                  {/* ── NODE INSPECTOR ── */}
                  {!inspectedEdgeId && inspectedNodeId && (
                    <div className="flex flex-col gap-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-base">⚙️</span>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-theme leading-tight">Component Properties</h3>
                            <p className="text-[10px] text-muted font-mono truncate max-w-[140px]" title={inspectedNodeId}>{inspectedNodeId}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setInspectedNodeId(null); setActiveTab("details"); }}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-muted hover:text-theme transition-colors cursor-pointer text-base"
                          title="Close"
                        >✕</button>
                      </div>

                      {/* Standard Properties */}
                      {propertyElements && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-semibold text-muted uppercase tracking-widest">Properties</span>
                          <div className="space-y-2">{propertyElements}</div>
                        </div>
                      )}

                      {/* Custom Properties Section */}
                      <div className="flex flex-col gap-2 rounded-xl border border-theme/30 bg-[var(--surface)] p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-muted uppercase tracking-widest">Custom Properties</span>
                          <button
                            type="button"
                            onClick={onAddCustomProperty}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--brand)] hover:bg-[var(--brand)]/10 rounded-md transition-colors border border-[var(--brand)]/30 hover:border-[var(--brand)] cursor-pointer"
                            title="Add custom property"
                          >
                            <MdAdd size={14} />
                            <span>Add</span>
                          </button>
                        </div>
                        <div className="space-y-2">
                          {customPropertyElements ?? (
                            <p className="text-xs text-muted/60 text-center py-2">No custom properties yet</p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        {isNodeInGroup && onDetachFromGroup && (
                          <button
                            type="button"
                            className="w-full px-3 py-2.5 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 transition-all font-medium text-sm cursor-pointer flex items-center justify-center gap-2"
                            onClick={onDetachFromGroup}
                            title="Remove this node from its parent group"
                          >
                            <span>🔓</span>
                            <span>Detach from Group</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="w-full px-3 py-2.5 bg-[var(--brand)] text-white rounded-lg hover:bg-[var(--brand)]/90 transition-all font-medium text-sm cursor-pointer"
                          onClick={handleSave}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}

                  {/* empty state */}
                  {!inspectedNodeId && !inspectedEdgeId && (
                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--brand)]/8 flex items-center justify-center">
                        <span className="text-2xl">✦</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-theme">Nothing selected</p>
                        <p className="text-xs text-muted mt-1">Click a node ⚙️ or an edge to inspect its properties.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "assessment" && (
                <div>
                  {assessmentResult ? (
                    <div className="space-y-4">

                      {/* ── 1. Score Header ── */}
                      <div className="p-4 border rounded-xl bg-[var(--surface)] flex items-center gap-4">
                        {/* Score ring */}
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                            <circle cx="32" cy="32" r={RING_RADIUS} fill="none" stroke="var(--border)" strokeWidth="6" />
                            <circle
                              cx="32" cy="32" r={RING_RADIUS} fill="none"
                              stroke={scoreColor(assessmentResult.score)}
                              strokeWidth="6"
                              strokeDasharray={`${(assessmentResult.score / 100) * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-theme">
                            {assessmentResult.score}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-theme text-base">Assessment Score</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              assessmentResult.isValid
                                ? "bg-green-500/15 text-green-500"
                                : "bg-amber-500/15 text-amber-500"
                            }`}>
                              {assessmentResult.isValid ? "✅ Pass" : "⚠️ Needs Work"}
                            </span>
                          </div>
                          {assessmentResult.processingTimeMs && (
                            <div className="text-[10px] text-muted mt-1">
                              Analysed in {(assessmentResult.processingTimeMs / 1000).toFixed(1)}s
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── 2. Score Breakdown ── */}
                      {assessmentResult.scores && (
                        <div className="p-4 border rounded-xl bg-[var(--surface)] space-y-3">
                          <div className="font-semibold text-theme text-sm flex items-center gap-2">
                            <span>📊</span><span>Score Breakdown</span>
                          </div>
                          {DISPLAY_GROUPS.map(({ label, keys }) => {
                            const s = assessmentResult.scores;
                            if (!s) return null;
                            const vals = keys
                              .map(k => (s as unknown as Record<string, number | undefined>)[k])
                              .filter((v): v is number => v != null);
                            if (vals.length === 0) return null;
                            const val = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
                            const color = scoreColor(val);
                            const subtitle = keys.length > 1
                              ? keys.map(k => DIM_LABELS[k] ?? k.replaceAll("_", " ")).join(" · ")
                              : null;
                            return (
                              <div key={label}>
                                <div className="flex justify-between items-center mb-1">
                                  <div>
                                    <span className="text-xs text-muted">{label}</span>
                                    {subtitle && (
                                      <span className="text-[10px] text-muted/50 ml-1.5">{subtitle}</span>
                                    )}
                                  </div>
                                  <span className="text-xs font-semibold" style={{ color }}>{val}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${val}%`, backgroundColor: color }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* ── 3. What Went Well ── */}
                      <div className="p-4 border rounded-xl bg-[var(--surface)]">
                        <div className="font-semibold text-theme text-sm mb-3 flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>What Went Well</span>
                        </div>
                        {assessmentResult.architectureStrengths.length > 0 ? (
                          <ul className="space-y-1.5">
                            {assessmentResult.architectureStrengths.map((s) => (
                              <li key={s} className="flex items-start gap-2 text-sm">
                                <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
                                <span className="text-theme">{s}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted">No notable strengths detected.</p>
                        )}
                      </div>

                      {/* ── 4. Where to Improve ── */}
                      <div className="p-4 border rounded-xl bg-[var(--surface)]">
                        <div className="font-semibold text-theme text-sm mb-3 flex items-center gap-2">
                          <span className="text-orange-500">↑</span>
                          <span>Where to Improve</span>
                        </div>
                        {assessmentResult.improvements.length > 0 ? (
                          <ul className="space-y-1.5 mb-3">
                            {assessmentResult.improvements.map((imp) => (
                              <li key={imp} className="flex items-start gap-2 text-sm">
                                <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>
                                <span className="text-theme">{imp}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted mb-3">No specific improvements suggested.</p>
                        )}
                        {assessmentResult.suggestions && assessmentResult.suggestions.length > 0 && (
                          <>
                            <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">Suggestions</div>
                            <ul className="space-y-1.5">
                              {assessmentResult.suggestions.map((s) => (
                                <li key={s} className="flex items-start gap-2 text-sm">
                                  <span className="text-[var(--brand)] mt-0.5 flex-shrink-0">→</span>
                                  <span className="text-muted">{s}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>

                      {/* ── 5. Analysis & Feedback ── */}
                      {((assessmentResult.detailedAnalysis && Object.keys(assessmentResult.detailedAnalysis).length > 0) ||
                        assessmentResult.feedback.length > 0) && (() => {
                        // Group feedback items by category for co-location with analysis
                        const feedbackByCategory: Record<string, typeof assessmentResult.feedback> = {};
                        const uncategorisedFeedback: typeof assessmentResult.feedback = [];
                        for (const fb of assessmentResult.feedback) {
                          if (assessmentResult.detailedAnalysis?.[fb.category]) {
                            if (!feedbackByCategory[fb.category]) feedbackByCategory[fb.category] = [];
                            feedbackByCategory[fb.category].push(fb);
                          } else {
                            uncategorisedFeedback.push(fb);
                          }
                        }

                        return (
                          <div className="p-4 border rounded-xl bg-[var(--surface)] space-y-4">
                            <div className="font-semibold text-theme text-sm flex items-center gap-2">
                              <span>🔍</span><span>Analysis &amp; Feedback</span>
                            </div>

                            {/* Per-dimension: analysis prose + its feedback items */}
                            {assessmentResult.detailedAnalysis &&
                              Object.entries(assessmentResult.detailedAnalysis).map(([dim, text]) => {
                                if (!text) return null;
                                const dimFeedback = feedbackByCategory[dim] ?? [];
                                return (
                                  <div key={dim} className="space-y-1.5">
                                    {/* Dimension heading */}
                                    <div className="text-[10px] font-bold text-[var(--brand)] uppercase tracking-widest">
                                      {DIM_LABELS[dim] ?? dim}
                                    </div>
                                    {/* Analysis prose */}
                                    <div className="text-xs text-theme leading-relaxed pl-2 border-l-2 border-[var(--brand)]/30">
                                      {text}
                                    </div>
                                    {/* Feedback items for this dimension */}
                                    {dimFeedback.map((f, i) => (
                                      <div
                                        key={`${dim}-fb-${i}`}
                                        className={`flex items-start gap-1.5 pl-2 border-l-2 ${FEEDBACK_TYPE_BORDER[f.type] ?? "border-[var(--brand)]/50"}`}
                                      >
                                        <span className="text-[10px] mt-0.5 flex-shrink-0">{FEEDBACK_TYPE_ICON[f.type]}</span>
                                        <span className="text-xs text-theme leading-relaxed">{f.message}</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}

                            {/* Feedback items whose category has no analysis entry (e.g. component_description) */}
                            {uncategorisedFeedback.length > 0 && (
                              <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
                                {uncategorisedFeedback.map((f) => (
                                  <div
                                  key={`uncategorised-${f.category}-${f.message.slice(0, 24)}`}
                                    className={`border-l-2 ${FEEDBACK_TYPE_BORDER[f.type] ?? "border-[var(--brand)]/50"} pl-3 py-0.5`}
                                  >
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <span className="text-[10px]">{FEEDBACK_TYPE_ICON[f.type]}</span>
                                      <span className="text-[10px] font-bold text-[var(--brand)] uppercase tracking-widest">
                                        {f.category.replaceAll("_", " ")}
                                      </span>
                                    </div>
                                    <div className="text-xs text-theme leading-relaxed">{f.message}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* ── 7. Missing / Unclear ── */}
                      {((assessmentResult.missingComponents && assessmentResult.missingComponents.length > 0) ||
                        (assessmentResult.missingDescriptions && assessmentResult.missingDescriptions.length > 0) ||
                        (assessmentResult.unclearConnections && assessmentResult.unclearConnections.length > 0)) && (
                        <div className="p-4 border border-red-500/20 rounded-xl bg-red-500/5">
                          <div className="font-semibold text-red-400 text-sm mb-3 flex items-center gap-2">
                            <span>⚠</span><span>Gaps Identified</span>
                          </div>
                          {assessmentResult.missingComponents && assessmentResult.missingComponents.length > 0 && (
                            <div className="mb-2">
                              <div className="text-[10px] font-bold text-red-400/80 uppercase tracking-widest mb-1">Missing Components</div>
                              <ul className="space-y-1">
                                {assessmentResult.missingComponents.map((m) => (
                                  <li key={m} className="text-xs text-theme flex items-start gap-1.5">
                                    <span className="text-red-400 flex-shrink-0">•</span>{m}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {assessmentResult.missingDescriptions && assessmentResult.missingDescriptions.length > 0 && (
                            <div className="mb-2">
                              <div className="text-[10px] font-bold text-red-400/80 uppercase tracking-widest mb-1">Missing Descriptions</div>
                              <ul className="space-y-1">
                                {assessmentResult.missingDescriptions.map((m) => (
                                  <li key={m} className="text-xs text-theme flex items-start gap-1.5">
                                    <span className="text-red-400 flex-shrink-0">•</span>{m}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {assessmentResult.unclearConnections && assessmentResult.unclearConnections.length > 0 && (
                            <div>
                              <div className="text-[10px] font-bold text-red-400/80 uppercase tracking-widest mb-1">Unclear Connections</div>
                              <ul className="space-y-1">
                                {assessmentResult.unclearConnections.map((m) => (
                                  <li key={m} className="text-xs text-theme flex items-start gap-1.5">
                                    <span className="text-red-400 flex-shrink-0">•</span>{m}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── 8. Interview Follow-up Questions ── */}
                      {assessmentResult.interviewQuestions && assessmentResult.interviewQuestions.length > 0 && (
                        <div className="border rounded-xl bg-[var(--surface)] overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShowInterviewQuestions((v) => !v)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">🎯</span>
                              <span className="font-semibold text-theme text-sm">Interview Follow-up Questions</span>
                              <span className="text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 px-1.5 py-0.5 rounded-full">
                                {assessmentResult.interviewQuestions.length}
                              </span>
                            </div>
                            <PiCaretDownBold
                              size={14}
                              className={`text-muted transition-transform ${showInterviewQuestions ? "rotate-180" : ""}`}
                            />
                          </button>
                          {showInterviewQuestions && (
                            <div className="px-4 pb-4 space-y-2.5 border-t border-[var(--border)]">
                              <p className="text-[10px] text-muted pt-3 pb-1">
                                Questions tailored to your specific design — think through these before your interview.
                              </p>
                              <ol className="space-y-2.5 list-none">
                                {assessmentResult.interviewQuestions.map((q, i) => (
                                  <li key={`iq-${q.slice(0, 30)}`} className="flex items-start gap-2.5">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                                      {i + 1}
                                    </span>
                                    <span className="text-xs text-theme leading-relaxed">{q}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Copy / Download ── */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={copyAssessment}
                          className="flex-1 px-3 py-2 bg-theme border border-theme rounded-md hover:bg-[var(--bg-hover)] transition-colors text-sm"
                        >
                          📋 Copy JSON
                        </button>
                        <button
                          type="button"
                          onClick={downloadAssessment}
                          className="flex-1 px-3 py-2 bg-theme border border-theme rounded-md hover:bg-[var(--bg-hover)] transition-colors text-sm"
                        >
                          💾 Download
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📊</div>
                      <div className="text-lg font-semibold text-theme mb-2">
                        No Assessment Yet
                      </div>
                      <div className="text-sm text-muted">
                        Run an assessment to see your design evaluation and
                        feedback.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
};

export default InspectorPanel;
