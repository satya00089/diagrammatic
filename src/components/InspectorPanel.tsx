import React from "react";
import { PiDotsSixVerticalBold, PiCaretDownBold } from "react-icons/pi";
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
  activeTab: "details" | "inspector";
  setActiveTab: (t: "details" | "inspector") => void;
  inspectedNodeId: string | null;
  setInspectedNodeId: (id: string | null) => void;
  propertyElements: React.ReactNode;
  customPropertyElements: React.ReactNode;
  onAddCustomProperty: () => void;
  handleSave: () => void;
  assessmentResult?: import("../types/systemDesign").ValidationResult | null;
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
}) => {
  const [width, setWidth] = React.useState(320); // px
  const minWidth = 260;
  const maxWidth = 640;
  const resizingRef = React.useRef(false);
  const panelRef = React.useRef<HTMLElement | null>(null);
  const [showHints, setShowHints] = React.useState(false);

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

  // Hide panel for free design mode when no node is selected
  const isFreeDesignMode = problem?.id === "free";
  const shouldHidePanel = isFreeDesignMode && !inspectedNodeId;

  // Auto-switch to inspector tab when node is selected in free design mode
  React.useEffect(() => {
    if (isFreeDesignMode && inspectedNodeId && activeTab === "details") {
      setActiveTab("inspector");
    }
  }, [isFreeDesignMode, inspectedNodeId, activeTab, setActiveTab]);

  if (!problem || shouldHidePanel) return null;

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
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
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
    <aside
      ref={panelRef}
      className="bg-surface border-l border-theme p-4 flex flex-col h-full relative inspector-resizable"
      data-width={width}
    >
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
        className="flex items-center justify-start gap-2"
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
            {/* Assessment summary */}
            {assessmentResult && (
              <div className="mb-4 p-2 border rounded bg-[var(--surface)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-theme">
                    Assessment
                  </div>
                  <div className="text-sm font-semibold text-theme">
                    {assessmentResult.score}%
                  </div>
                </div>
                <div className="text-xs text-muted mb-2">
                  {assessmentResult.isValid ? "Pass" : "Needs work"}
                </div>
                <div className="space-y-1 text-xs">
                  {assessmentResult.feedback.slice(0, 3).map((f) => (
                    <div
                      key={`${f.category}-${f.type}`}
                      className="text-sm text-theme"
                    >
                      {f.message}
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={copyAssessment}
                    className="px-2 py-1 bg-theme border border-theme rounded text-sm hover:bg-[var(--bg-hover)]"
                  >
                    Copy JSON
                  </button>
                  <button
                    type="button"
                    onClick={downloadAssessment}
                    className="px-2 py-1 bg-theme border border-theme rounded text-sm hover:bg-[var(--bg-hover)]"
                  >
                    Download JSON
                  </button>
                </div>

                {/* Expanded assessment details */}
                <div className="mt-3 text-xs">
                  <div className="font-medium text-sm mb-1">
                    What went right
                  </div>
                  {assessmentResult.architectureStrengths.length > 0 ? (
                    <ul className="list-disc list-inside text-xs mb-2">
                      {assessmentResult.architectureStrengths.map((s) => (
                        <li key={`strength-${s}`}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-muted mb-2">
                      No notable strengths detected.
                    </div>
                  )}

                  <div className="font-medium text-sm mb-1">
                    What to improve
                  </div>
                  {assessmentResult.improvements.length > 0 ? (
                    <ul className="list-disc list-inside text-xs mb-2">
                      {assessmentResult.improvements.map((imp) => (
                        <li key={`imp-${imp}`}>{imp}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-muted mb-2">
                      No specific improvements suggested.
                    </div>
                  )}

                  <div className="font-medium text-sm mb-1">Feedback</div>
                  <div className="space-y-1">
                    {assessmentResult.feedback.map((f) => (
                      <div key={`${f.category}-${f.type}`} className="text-xs">
                        <div className="font-medium">
                          {f.category.toUpperCase()}
                        </div>
                        <div className="text-muted">{f.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
                    <span className="text-green-500 mt-0.5 text-xs">✓</span>
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
                  <li key={constraint} className="flex items-start space-x-2">
                    <span className="text-yellow-500 mt-0.5 text-xs">⚠</span>
                    <span className="text-xs text-muted">{constraint}</span>
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
                <h4 className="text-sm font-semibold text-theme">💡 Hints</h4>
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
              <h4 className="text-sm font-semibold text-theme mb-2">Tags</h4>
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
                  <div className="space-y-2">{customPropertyElements}</div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex space-x-2 pt-4 border-t border-theme">
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
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default InspectorPanel;
