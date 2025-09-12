import React from "react";

type InspectorPanelProps = {
  problem: {
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
  handleSave: () => void;
};

const InspectorPanel: React.FC<InspectorPanelProps> = ({
  problem,
  activeTab,
  setActiveTab,
  inspectedNodeId,
  setInspectedNodeId,
  propertyElements,
  handleSave,
}) => {
  if (!problem) return null;

  return (
    <aside className="w-80 bg-surface border-l border-theme p-4 flex flex-col h-full">
      <div
        className="flex items-center justify-start gap-2"
        role="tablist"
        aria-label="Sidebar tabs"
      >
        <button
          type="button"
          role="tab"
          className={`flex items-center gap-2 px-3 py-2 rounded-t-md border-b-2 transition-colors ${activeTab === "details" ? "border-[var(--brand)] bg-[var(--brand)]/5 text-[var(--brand)]" : "border-transparent text-theme hover:bg-[var(--bg-hover)]"}`}
          onClick={() => setActiveTab("details")}
        >
          <span className="text-sm">📄</span>
          <span className="text-sm font-medium">Details</span>
        </button>

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
              <h4 className="text-sm font-semibold text-theme mb-2">Hints</h4>
              <div className="space-y-2">
                {problem.hints.map((hint) => (
                  <div
                    key={hint}
                    className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 dark:border-yellow-600 p-2 rounded-r-lg"
                  >
                    <div className="text-xs text-muted">{hint}</div>
                  </div>
                ))}
              </div>
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
                <div className="text-sm text-theme mb-2">
                  Node: {inspectedNodeId}
                </div>
                <div className="space-y-2">{propertyElements}</div>
                <div className="mt-4 flex space-x-2">
                  <button
                    type="button"
                    className="px-3 py-1 bg-[var(--brand)] text-white rounded"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 bg-theme rounded"
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
