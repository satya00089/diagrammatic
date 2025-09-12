import React, { useRef, useState } from "react";
import type { SystemDesignProblem } from "../types/systemDesign";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useTheme } from "../hooks/useTheme";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  addEdge,
  useNodesState,
  useEdgesState,
  Position,
} from "@xyflow/react";
import type { Node, Edge, Connection } from "@xyflow/react";
import { COMPONENTS } from "../config/components";
import type { ComponentProperty, CanvasComponent } from "../types/canvas";

interface SystemDesignPlaygroundProps {
  problem: SystemDesignProblem | null;
  onBack: () => void;
}

// Minimal custom node for the canvas (icon + label, solid background + styled handles)
const MinimalNode: React.FC<{
  id: string;
  data: { label: string; icon?: string; expanded?: boolean };
}> = ({ id, data }) => {
  // these handlers dispatch events to the page via custom DOM events the ReactFlow wrapper can listen to
  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ev = new CustomEvent("diagram:node-delete", { detail: { id } });
    window.dispatchEvent(ev);
  };

  const onToggleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ev = new CustomEvent("diagram:node-toggle", { detail: { id } });
    window.dispatchEvent(ev);
  };

  return (
    <div className="min-w-[140px] max-w-xs px-3 py-2 bg-surface border border-theme rounded-md text-theme text-sm shadow-sm flex items-center gap-2">
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 14,
          height: 14,
          background: "var(--brand)",
          borderRadius: 8,
          border: "2px solid var(--surface)",
          boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
        }}
      />

      <div className="flex items-center gap-2 truncate flex-1">
        <span className="text-lg leading-none">{data.icon}</span>
        <span className="truncate">{data.label}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label="Settings"
          onClick={onToggleSettings}
          className="p-1 rounded hover:bg-[var(--bg-hover)]"
        >
          ⚙️
        </button>
        <button
          aria-label="Delete"
          onClick={onDelete}
          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
        >
          🗑️
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 14,
          height: 14,
          background: "var(--brand)",
          borderRadius: 8,
          border: "2px solid var(--surface)",
          boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
        }}
      />
    </div>
  );
};

// Palette item extracted to avoid inline nested functions inside the main component
const PaletteItem: React.FC<{
  comp: CanvasComponent;
  onAdd: (id: string) => void;
}> = ({ comp, onAdd }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer?.setData(
      "application/reactflow",
      JSON.stringify({ type: comp.id })
    );
    e.dataTransfer?.setData("text/plain", comp.id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onAdd(comp.id);
    }
  };

  return (
    <button
      type="button"
      draggable
      aria-label={`Add ${comp.label} to canvas`}
      onDragStart={handleDragStart}
      onKeyDown={handleKeyDown}
      className="w-full text-left p-3 bg-[var(--surface)] border border-theme rounded-lg cursor-grab select-none"
    >
      <div className="text-sm font-medium text-theme">
        {comp.icon} {comp.label}
      </div>
      <div className="text-xs text-muted">{comp.description}</div>
    </button>
  );
};

const SystemDesignPlayground: React.FC<SystemDesignPlaygroundProps> = ({
  problem,
  onBack,
}) => {
  useTheme(); // ensure theme applied for this page

  // determine difficulty badge classes in one place to avoid nested ternary in JSX
  const difficultyBadgeClass = (() => {
    if (!problem) return "";
    const d = problem.difficulty;
    if (d === "Easy")
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (d === "Medium")
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  })();

  // start with empty canvas state — the user will drag & drop components
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);

  const onConnect = (connection: Connection) =>
    setEdges((eds) => addEdge(connection, eds));

  // ref to the reactflow wrapper to compute drop position
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    const data =
      event.dataTransfer?.getData("application/reactflow") ||
      event.dataTransfer?.getData("text/plain");
    let type = data;
    try {
      if (data) {
        const parsed = JSON.parse(data);
        type = parsed.type || data;
      }
    } catch {
      // not json, keep data as-is
    }

    const x = event.clientX - (reactFlowBounds?.left ?? 0);
    const y = event.clientY - (reactFlowBounds?.top ?? 0);
    const position = { x, y };

    const id = `${type}-${Date.now()}`;
    const comp = COMPONENTS.find((c) => c.id === type);
    const newNode: Node = {
      id,
      position,
      type: "custom",
      // include icon so the custom node can render it
      data: { label: comp?.label ?? type, icon: comp?.icon },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  // register node types
  const nodeTypes = { custom: MinimalNode };

  // inspector state
  const [inspectedNodeId, setInspectedNodeId] = useState<string | null>(null);
  type NodeProps = Record<string, string | number | boolean | undefined>;
  const [nodeProps, setNodeProps] = useState<NodeProps>({});
  // which tab is active in the right sidebar: 'details' or 'inspector'
  const [activeRightTab, setActiveRightTab] = useState<"details" | "inspector">(
    "details"
  );

  // ref to hold latest inspectedNodeId for event handlers to read without adding deps
  const inspectedNodeIdRef = useRef<string | null>(null);
  React.useEffect(() => {
    inspectedNodeIdRef.current = inspectedNodeId;
  }, [inspectedNodeId]);

  // handlers moved outside the effect to reduce nesting depth. Use refs to keep stable references.
  const handleDiagramNodeDeleteRef = useRef<((e: Event) => void) | undefined>(
    undefined
  );
  handleDiagramNodeDeleteRef.current = (e: Event) => {
    const ce = e as CustomEvent;
    const id: string = ce.detail.id;
    setNodes((nds) => nds.filter((n) => n.id !== id));
    if (inspectedNodeIdRef.current === id) {
      setInspectedNodeId(null);
      setActiveRightTab("details");
    }
  };

  const handleDiagramNodeToggleRef = useRef<((e: Event) => void) | undefined>(
    undefined
  );
  handleDiagramNodeToggleRef.current = (e: Event) => {
    const ce = e as CustomEvent;
    const id: string = ce.detail.id;
    setInspectedNodeId((curr) => {
      const next = curr === id ? null : id;
      if (next) setActiveRightTab("inspector");
      else setActiveRightTab("details");
      return next;
    });
  };

  // register window event listeners once (mount/unmount)
  React.useEffect(() => {
    const deleteListener = (e: Event) =>
      handleDiagramNodeDeleteRef.current?.(e);
    const toggleListener = (e: Event) =>
      handleDiagramNodeToggleRef.current?.(e);
    window.addEventListener(
      "diagram:node-delete",
      deleteListener as EventListener
    );
    window.addEventListener(
      "diagram:node-toggle",
      toggleListener as EventListener
    );
    return () => {
      window.removeEventListener(
        "diagram:node-delete",
        deleteListener as EventListener
      );
      window.removeEventListener(
        "diagram:node-toggle",
        toggleListener as EventListener
      );
    };
  }, []);

  React.useEffect(() => {
    if (!inspectedNodeId) return;
    const n = nodes.find((x) => x.id === inspectedNodeId);
    setNodeProps((n?.data ?? {}) as NodeProps);
  }, [inspectedNodeId, nodes]);

  // --- Helpers to reduce nested function depth in JSX ---
  const setPropBoolean = (key: string, value: boolean) => {
    setNodeProps((s) => ({ ...s, [key]: value }));
  };

  const setPropNumber = (key: string, value: number) => {
    setNodeProps((s) => ({ ...s, [key]: value }));
  };

  const setPropString = (key: string, value: string) => {
    setNodeProps((s) => ({ ...s, [key]: value }));
  };

  const setPropSelect = (key: string, value: string) => {
    setNodeProps((s) => ({ ...s, [key]: value }));
  };

  const renderProperty = (p: ComponentProperty) => {
    const inputId = `${inspectedNodeId}-${p.key}`;
    const raw = nodeProps[p.key];

    // coerce values to types expected by inputs (avoid nested ternary expressions)
    let numberValue: number | undefined;
    if (typeof raw === "number") {
      numberValue = raw;
    } else if (typeof p.default === "number") {
      numberValue = p.default;
    } else {
      numberValue = undefined;
    }

    let stringValue: string;
    if (typeof raw === "string") {
      stringValue = raw;
    } else if (p.default != null) {
      stringValue = String(p.default);
    } else {
      stringValue = "";
    }

    let selectValue: string | undefined;
    if (typeof raw === "string") {
      selectValue = raw;
    } else if (p.default != null) {
      selectValue = String(p.default);
    } else {
      selectValue = undefined;
    }

    const checkedValue: boolean = Boolean(raw);

    return (
      <div key={p.key} className="flex flex-col">
        <label htmlFor={inputId} className="text-xs text-muted mb-1">
          {p.label}
        </label>
        {p.type === "boolean" && (
          <input
            id={inputId}
            type="checkbox"
            checked={checkedValue}
            onChange={(e) => setPropBoolean(p.key, e.target.checked)}
          />
        )}
        {p.type === "number" && (
          <input
            id={inputId}
            type="number"
            value={numberValue ?? ""}
            onChange={(e) => setPropNumber(p.key, Number(e.target.value))}
            className="border p-1 rounded"
            aria-label={p.label}
          />
        )}
        {p.type === "string" && (
          <input
            id={inputId}
            type="text"
            value={stringValue}
            onChange={(e) => setPropString(p.key, e.target.value)}
            className="border p-1 rounded"
            aria-label={p.label}
          />
        )}
        {p.type === "select" && (
          <select
            id={inputId}
            value={selectValue ?? ""}
            onChange={(e) => setPropSelect(p.key, e.target.value)}
            className="border p-1 rounded"
            aria-label={p.label}
          >
            {p.options?.map((o: string) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  };

  // compute property elements once to avoid inline IIFE and deep nesting inside JSX
  let propertyElements: React.ReactNode = null;
  if (inspectedNodeId) {
    const node = nodes.find((n) => n.id === inspectedNodeId);
    if (!node) {
      propertyElements = (
        <div className="text-sm text-muted">Node not found</div>
      );
    } else {
      const comp = COMPONENTS.find((c) => c.label === node.data.label);
      if (!comp?.properties) {
        propertyElements = (
          <div className="text-sm text-muted">No properties defined</div>
        );
      } else {
        propertyElements = comp.properties.map((p: ComponentProperty) =>
          renderProperty(p)
        );
      }
    }
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No problem selected
          </h2>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  function addNodeFromPalette(id: string) {
    const comp = COMPONENTS.find((c) => c.id === id);
    // place newly added node roughly in the center of the canvas wrapper
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    const x = (bounds?.width ?? 400) / 2;
    const y = (bounds?.height ?? 300) / 2;
    const position = { x, y };

    const nodeId = `${id}-${Date.now()}`;
    const newNode: Node = {
      id: nodeId,
      position,
      type: "custom",
      data: { label: comp?.label ?? id, icon: comp?.icon },
    };

    setNodes((nds) => [...nds, newNode]);
  }

  // persist nodeProps back into node data
  const handleSave = () => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === inspectedNodeId
          ? { ...n, data: { ...n.data, ...nodeProps } }
          : n
      )
    );
  };

  return (
    <div className="h-screen flex flex-col bg-theme">
      {/* Header */}
      <div className="bg-surface shadow-sm border-b border-theme px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="px-3 py-2 text-muted hover:text-theme hover:bg-[var(--bg-hover)] rounded-md transition-colors"
            >
              ← Back to Dashboard
            </button>
            <div>
              <h1 className="text-lg font-semibold text-theme">
                {problem.title}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-muted">
                <span
                  className={`px-2 py-1 rounded text-xs ${difficultyBadgeClass}`}
                >
                  {problem.difficulty}
                </span>
                <span className="text-muted">{problem.estimatedTime}</span>
                <span className="text-muted">•</span>
                <span className="text-muted">{problem.category}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Component Palette */}
        <div className="w-64 bg-surface border-r border-theme p-4">
          <h3 className="text-lg font-semibold text-theme mb-4">
            System Components
          </h3>
          <div className="space-y-2">
            {COMPONENTS.map((c) => (
              <PaletteItem key={c.id} comp={c} onAdd={addNodeFromPalette} />
            ))}
          </div>
          <div className="mt-4 p-3 bg-[var(--brand, #eaf0ff)] border border-theme rounded-lg text-xs text-brand">
            <div className="font-medium mb-1">💡 Coming Soon:</div>
            <div className="text-brand">Drag & drop components to canvas</div>
          </div>
        </div>

        {/* Center - ReactFlow Canvas */}
        <div className="flex-1 relative bg-theme min-h-0">
          <section
            className="w-full h-full"
            ref={reactFlowWrapper}
            onDragOver={onDragOver}
            onDrop={onDrop}
            aria-label="Diagram canvas drop area"
          >
            <ReactFlow
              className="w-full h-full"
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <MiniMap nodeStrokeWidth={3} />
              <Controls />
              <Background gap={16} />
            </ReactFlow>
          </section>
        </div>

        {/* Right Sidebar - Details + Node Inspector (Tabs) */}
        <div className="w-80 bg-surface border-l border-theme p-4 overflow-y-auto">
          <div
            className="flex items-center justify-start gap-2"
            role="tablist"
            aria-label="Sidebar tabs"
          >
            <button
              role="tab"
              className={`flex items-center gap-2 px-3 py-2 rounded-t-md border-b-2 transition-colors ${activeRightTab === "details" ? "border-[var(--brand)] bg-[var(--brand)]/5 text-[var(--brand)]" : "border-transparent text-theme hover:bg-[var(--bg-hover)]"}`}
              onClick={() => setActiveRightTab("details")}
            >
              <span className="text-sm">📄</span>
              <span className="text-sm font-medium">Details</span>
            </button>

            <button
              role="tab"
              className={`flex items-center gap-2 px-3 py-2 rounded-t-md border-b-2 transition-colors ${activeRightTab === "inspector" ? "border-[var(--brand)] bg-[var(--brand)]/5 text-[var(--brand)]" : "border-transparent text-theme hover:bg-[var(--bg-hover)]"}`}
              onClick={() => setActiveRightTab("inspector")}
            >
              <span className="text-sm">⚙️</span>
              <span className="text-sm font-medium">Properties</span>
            </button>
          </div>
          {/* Muted divider under tabs */}
          <div
            className="w-full h-px bg-[var(--muted)]/20 mb-4"
            aria-hidden="true"
          />

          {activeRightTab === "details" && (
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

          {activeRightTab === "inspector" && (
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
                  {/** Render properties dynamically from COMPONENTS config based on node type label */}
                  <div className="space-y-2">{propertyElements}</div>
                  <div className="mt-4 flex space-x-2">
                    <button
                      className="px-3 py-1 bg-[var(--brand)] text-white rounded"
                      onClick={handleSave}
                    >
                      Save
                    </button>
                    <button
                      className="px-3 py-1 dark:bg-gray-600 bg-gray-200 rounded"
                      onClick={() => {
                        setInspectedNodeId(null);
                        setActiveRightTab("details");
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
      </div>
    </div>
  );
};

export default SystemDesignPlayground;
