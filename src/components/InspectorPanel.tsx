import React from "react";
import {
  PiDotsSixVerticalBold,
  PiCaretDownBold,
  PiCaretLeftBold,
  PiCaretRightBold,
} from "react-icons/pi";
import { MdAdd } from "react-icons/md";

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
  propertyElements: React.ReactNode;
  customPropertyElements: React.ReactNode;
  onAddCustomProperty: () => void;
  handleSave: () => void;
  assessmentResult?: import("../types/systemDesign").ValidationResult | null;
  onDetachFromGroup?: () => void;
  isNodeInGroup?: boolean;
};

const InspectorPanel: React.FC<InspectorPanelProps> = ({
  problem,
  activeTab,
  setActiveTab,
  inspectedNodeId,
  setInspectedNodeId,
  propertyElements,
  customPropertyElements,
  onAddCustomProperty,
  handleSave,
  assessmentResult,
  onDetachFromGroup,
  isNodeInGroup,
}) => {
  const [width, setWidth] = React.useState(320); // px
  const minWidth = 260;
  const maxWidth = 640;
  const resizingRef = React.useRef(false);
  const panelRef = React.useRef<HTMLElement | null>(null);
  const [showHints, setShowHints] = React.useState(false);
  const [open, setOpen] = React.useState(true);

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

  // Auto-collapse when no node is selected in free design mode
  React.useEffect(() => {
    if (isFreeDesignMode && !inspectedNodeId) {
      setOpen(false);
    }
  }, [isFreeDesignMode, inspectedNodeId]);

  // Auto-switch to inspector tab and expand when node is selected in free design mode
  React.useEffect(() => {
    if (isFreeDesignMode && inspectedNodeId) {
      setActiveTab("inspector");
      setOpen(true);
    }
  }, [isFreeDesignMode, inspectedNodeId, setActiveTab]);

  if (!problem) return null;

  const copyAssessment = async () => {
    if (!assessmentResult) return;
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(assessmentResult, null, 2),
      );
    } catch {
      // fallback: create temporary textarea
      const t = document.createElement("textarea");
      t.value = JSON.stringify(assessmentResult, null, 2);
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      try {
        document.execCommand("copy");
      } catch {
        // Copy failed
      }
      t.remove();
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
                  <h3 className="text-lg font-semibold text-theme mb-3">
                    Component Properties
                  </h3>
                  {!inspectedNodeId && (
                    <div className="text-sm text-muted">
                      Select a node settings (⚙️) to view properties.
                    </div>
                  )}
                  {inspectedNodeId && (
                    <div>
                      <div className="text-sm text-theme mb-3">
                        Node: {inspectedNodeId}
                      </div>

                      {/* Standard Properties */}
                      {propertyElements && (
                        <div className="mb-6">
                          <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                            Standard Properties
                          </div>
                          <div className="space-y-2">{propertyElements}</div>
                        </div>
                      )}

                      {/* Custom Properties Section */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-semibold text-muted uppercase tracking-wide">
                            Custom Properties
                          </div>
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
                          {customPropertyElements}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-theme">
                        {/* Detach from Group Button - Only show if node is in a group */}
                        {isNodeInGroup && onDetachFromGroup && (
                          <button
                            type="button"
                            className="w-full px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium text-sm cursor-pointer flex items-center justify-center gap-2"
                            onClick={onDetachFromGroup}
                            title="Remove this node from its parent group"
                          >
                            <span>🔓</span>
                            <span>Detach from Group</span>
                          </button>
                        )}

                        {/* Save and Close Buttons */}
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            className="flex-1 px-3 py-2 bg-[var(--brand)] text-white rounded-md hover:bg-[var(--brand)]/90 transition-colors font-medium text-sm cursor-pointer"
                            onClick={handleSave}
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            className="px-3 py-2 bg-theme border border-theme rounded-md hover:bg-[var(--bg-hover)] transition-colors text-sm cursor-pointer"
                            onClick={() => {
                              setInspectedNodeId(null);
                              setActiveTab("details");
                            }}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "assessment" && (
                <div>
                  {assessmentResult ? (
                    <div className="space-y-4">
                      {/* Score Header */}
                      <div className="p-4 border rounded-lg bg-[var(--surface)]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-lg font-semibold text-theme">
                            Assessment Score
                          </div>
                          <div className="text-2xl font-bold text-[var(--brand)]">
                            {assessmentResult.score}%
                          </div>
                        </div>
                        <div className="text-sm text-muted">
                          {assessmentResult.isValid
                            ? "✅ Pass"
                            : "⚠️ Needs Improvement"}
                        </div>
                      </div>

                      {/* What Went Right */}
                      <div className="p-4 border rounded-lg bg-[var(--surface)]">
                        <div className="font-semibold text-theme mb-3 flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>What Went Right</span>
                        </div>
                        {assessmentResult.architectureStrengths.length > 0 ? (
                          <ul className="space-y-2">
                            {assessmentResult.architectureStrengths.map((s) => (
                              <li
                                key={s}
                                className="flex items-start gap-2 text-sm"
                              >
                                <span className="text-green-500 mt-0.5">•</span>
                                <span className="text-theme">{s}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm text-muted">
                            No notable strengths detected.
                          </div>
                        )}
                      </div>

                      {/* What to Improve */}
                      <div className="p-4 border rounded-lg bg-[var(--surface)]">
                        <div className="font-semibold text-theme mb-3 flex items-center gap-2">
                          <span className="text-orange-500">!</span>
                          <span>What to Improve</span>
                        </div>
                        {assessmentResult.improvements.length > 0 ? (
                          <ul className="space-y-2">
                            {assessmentResult.improvements.map((imp) => (
                              <li
                                key={imp}
                                className="flex items-start gap-2 text-sm"
                              >
                                <span className="text-orange-500 mt-0.5">
                                  •
                                </span>
                                <span className="text-theme">{imp}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm text-muted">
                            No specific improvements suggested.
                          </div>
                        )}
                      </div>

                      {/* Detailed Feedback */}
                      <div className="p-4 border rounded-lg bg-[var(--surface)]">
                        <div className="font-semibold text-theme mb-3">
                          Detailed Feedback
                        </div>
                        <div className="space-y-3">
                          {assessmentResult.feedback.map((f) => (
                            <div
                              key={`${f.category}-${f.message}`}
                              className="border-l-2 border-[var(--brand)] pl-3 py-1"
                            >
                              <div className="font-medium text-xs text-[var(--brand)] uppercase mb-1">
                                {f.category}
                              </div>
                              <div className="text-sm text-theme">
                                {f.message}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
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
