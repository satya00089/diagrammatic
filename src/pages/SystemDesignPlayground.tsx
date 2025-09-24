import React, { useRef, useState } from "react";
import type {
  SystemDesignProblem,
  SystemDesignSolution,
  ValidationResult,
  ComponentType,
  ConnectionType,
} from "../types/systemDesign";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useTheme } from "../hooks/useTheme";
import { addEdge, useNodesState, useEdgesState } from "@xyflow/react";
import type { Node, Edge, Connection } from "@xyflow/react";
import { COMPONENTS } from "../config/components";
import ComponentPalette from "../components/ComponentPalette";
import DiagramCanvas from "../components/DiagramCanvas";
import InspectorPanel from "../components/InspectorPanel";
import type { ComponentProperty } from "../types/canvas";
import { systemDesignProblems } from "../data/problems";
import { useNavigate, useParams } from "react-router-dom";
import assessSolution from "../utils/assessor";
import CustomNode from "../components/Node";

interface SystemDesignPlaygroundProps {
  problem?: SystemDesignProblem | null;
  onBack?: () => void;
}

const SystemDesignPlayground: React.FC<SystemDesignPlaygroundProps> = () => {
  useTheme(); // ensure theme applied for this page
  const navigate = useNavigate();
  const params = useParams();
  const idFromUrl = params?.id;

  const urlProblem = React.useMemo(() => {
    if (!idFromUrl) return null;
    return systemDesignProblems.find((p) => p.id === idFromUrl) ?? null;
  }, [idFromUrl]);

  const problem = urlProblem;
  const onBack = () => navigate("/");

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

  // --- Assessment state & runner (hooks must be top-level before any returns) ---
  const [assessment, setAssessment] = React.useState<ValidationResult | null>(
    null
  );

  const runAssessment = () => {
    const solution: SystemDesignSolution = {
      components: nodes.map((n) => {
        const dataObj = (n.data ?? {}) as unknown;
        const maybeType = (dataObj as { type?: unknown }).type;
        let inferredType: ComponentType;
        if (typeof maybeType === "string")
          inferredType = maybeType as ComponentType;
        else if (typeof n.type === "string")
          inferredType = n.type as ComponentType;
        else inferredType = "microservice";

        const maybeLabel = (dataObj as { label?: unknown }).label;
        const label =
          typeof maybeLabel === "string" ? maybeLabel : String(n.id);

        return {
          id: n.id,
          type: inferredType,
          label,
          position: { x: n.position?.x ?? 0, y: n.position?.y ?? 0 },
          properties: dataObj as Record<string, unknown>,
        };
      }),
      connections: edges.map((e) => {
        const dataObj = (e.data ?? {}) as unknown;
        const maybeType = (dataObj as { type?: unknown }).type;
        const inferredType: ConnectionType =
          typeof maybeType === "string"
            ? (maybeType as ConnectionType)
            : "api-call";

        const maybeLabel = (dataObj as { label?: unknown }).label;
        const label = typeof maybeLabel === "string" ? maybeLabel : undefined;

        return {
          id: e.id ?? `${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          type: inferredType,
          label,
          properties: dataObj as Record<string, unknown>,
        };
      }),
      explanation: "",
      keyPoints: [],
    };

    const res = assessSolution(solution);
    setAssessment(res);
    setActiveRightTab("details");
  };

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
  const nodeTypes = { custom: CustomNode };

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
      <div key={p.key} className="flex flex-col px-1">
        {p.type === "boolean" ? (
          <label
            htmlFor={inputId}
            className="inline-flex items-center gap-2 text-sm text-theme"
          >
            <input
              id={inputId}
              type="checkbox"
              checked={checkedValue}
              onChange={(e) => setPropBoolean(p.key, e.target.checked)}
              className="w-4 h-4 cursor-pointer rounded border-theme text-theme"
            />
            <span className="text-sm text-theme">{p.label}</span>
          </label>
        ) : (
          <label htmlFor={inputId} className="text-xs text-muted mb-1">
            {p.label}
          </label>
        )}
        {p.type === "number" && (
          <input
            id={inputId}
            type="number"
            value={numberValue ?? ""}
            onChange={(e) => setPropNumber(p.key, Number(e.target.value))}
            className="border p-1 px-2 rounded bg-[var(--surface)] text-theme"
            aria-label={p.label}
          />
        )}
        {p.type === "text" && (
          <input
            id={inputId}
            type="text"
            value={stringValue}
            onChange={(e) => setPropString(p.key, e.target.value)}
            className="border p-1 px-2 rounded bg-[var(--surface)] text-theme"
            aria-label={p.label}
            placeholder={p.placeholder}
          />
        )}
        {p.type === "textarea" && (
          <textarea
            id={inputId}
            value={stringValue}
            onChange={(e) => setPropString(p.key, e.target.value)}
            className="border p-1 px-2 rounded bg-[var(--surface)] text-theme"
            aria-label={p.label}
            placeholder={p.placeholder}
            rows={4}
          />
        )}
        {p.type === "select" && (
          <select
            id={inputId}
            value={selectValue ?? ""}
            onChange={(e) => setPropSelect(p.key, e.target.value)}
            className="border p-1 px-2 rounded bg-[var(--surface)] text-theme"
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
            <button
              type="button"
              onClick={runAssessment}
              className="px-3 py-2 bg-[var(--brand)] text-white rounded-md hover:brightness-95"
              title="Run assessment on current diagram"
            >
              Assess
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        <ComponentPalette components={COMPONENTS} onAdd={addNodeFromPalette} />
        <DiagramCanvas
          reactFlowWrapperRef={
            reactFlowWrapper as React.RefObject<HTMLDivElement>
          }
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={
            onNodesChange as unknown as (...changes: unknown[]) => void
          }
          onEdgesChange={
            onEdgesChange as unknown as (...changes: unknown[]) => void
          }
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
        />
        <InspectorPanel
          problem={problem}
          activeTab={activeRightTab}
          setActiveTab={setActiveRightTab}
          inspectedNodeId={inspectedNodeId}
          setInspectedNodeId={setInspectedNodeId}
          propertyElements={propertyElements}
          handleSave={handleSave}
          assessmentResult={assessment}
        />
      </div>
    </div>
  );
};

export default SystemDesignPlayground;
