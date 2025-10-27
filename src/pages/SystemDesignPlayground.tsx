import React, { useRef, useState, useEffect } from "react";
import AnimatedCheckbox from "../components/shared/AnimatedCheckbox";
import { AnimatedNumberInput, AnimatedTextInput, AnimatedTextarea, AnimatedSelect } from "../components/shared/AnimatedInputFields";
import type {
  SystemDesignProblem,
  SystemDesignSolution,
  ValidationResult,
  ComponentType,
  ConnectionType,
} from "../types/systemDesign";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useTheme } from "../hooks/useTheme";
import { useNodesState, useEdgesState, addEdge } from "@xyflow/react";
import type { Node, Edge, Connection } from "@xyflow/react";
import { COMPONENTS } from "../config/components";
import ComponentPalette from "../components/ComponentPalette";
import DiagramCanvas from "../components/DiagramCanvas";
import InspectorPanel from "../components/InspectorPanel";
import type { ComponentProperty } from "../types/canvas";
import { useNavigate, useParams } from "react-router-dom";
import assessSolution from "../utils/assessor";
import CustomNode from "../components/Node";
import type { NodeData } from "../components/Node";
import CustomEdge from "../components/CustomEdge";

interface SystemDesignPlaygroundProps {
  problem?: SystemDesignProblem | null;
  onBack?: () => void;
}

// Create a wrapper component for CustomNode with onCopy prop
const NodeWithCopy = React.memo((props: { id: string; data: unknown; onCopy: (id: string, data: NodeData) => void }) => {
  const nodeData = props.data as NodeData;
  return (
    <CustomNode 
      id={props.id} 
      data={nodeData} 
      onCopy={props.onCopy} 
    />
  );
});

// Factory function to create node component with copy handler
const createNodeWithCopyHandler = (onCopy: (id: string, data: NodeData) => void) => {
  return (props: { id: string; data: unknown }) => (
    <NodeWithCopy {...props} onCopy={onCopy} />
  );
};

const SystemDesignPlayground: React.FC<SystemDesignPlaygroundProps> = () => {
  useTheme();
  const navigate = useNavigate();
  const params = useParams();
  const idFromUrl = params?.id;

  // State for problem data
  const [problem, setProblem] = useState<SystemDesignProblem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch problem from API
  useEffect(() => {
    if (!idFromUrl) {
      setLoading(false);
      setError("No problem ID provided");
      return;
    }

    const fetchProblem = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiUrl = import.meta.env.VITE_ASSESSMENT_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/v1/problem/${idFromUrl}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch problem: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setProblem(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching the problem');
        console.error('Error fetching problem:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [idFromUrl]);

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

  const onConnect = (connection: Connection) => {
    // Use React Flow's addEdge helper with our custom edge type
    const newEdge = {
      ...connection,
      type: "customEdge",
      data: { label: "", hasLabel: false },
    };
    setEdges((eds) => addEdge(newEdge, eds));
  };

  // --- Assessment state & runner (hooks must be top-level before any returns) ---
  const [assessment, setAssessment] = React.useState<ValidationResult | null>(
    null
  );

  const [isAssessing, setIsAssessing] = useState(false);

  const runAssessment = async () => {
    if (isAssessing) return;
    
    setIsAssessing(true);
    setAssessment(null);
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

        // Capture all node properties including custom ones
        const allProperties = (dataObj && typeof dataObj === 'object') 
          ? { ...dataObj } as Record<string, unknown>
          : {} as Record<string, unknown>;
        
        // Remove system properties from the properties object
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { label: _label, icon: _icon, subtitle: _subtitle, ...customProperties } = allProperties;

        return {
          id: n.id,
          type: inferredType,
          label,
          position: { x: n.position?.x ?? 0, y: n.position?.y ?? 0 },
          properties: {
            ...customProperties,
            // Include standard node data for reference
            nodeData: {
              label,
              icon: (dataObj as { icon?: unknown }).icon,
              subtitle: (dataObj as { subtitle?: unknown }).subtitle,
            }
          },
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

    try {
      console.log('Running AI assessment with solution:', solution);
      
      // Call AI assessor (now returns Promise) with problem context
      const res = await assessSolution(solution, problem);
      setAssessment(res);
      setActiveRightTab("details");
      
    } catch (error) {
      console.error('Assessment failed:', error);
      setAssessment({
        isValid: false,
        score: 0,
        feedback: [{
          type: 'error',
          message: 'Assessment failed. Please check your connection and try again.',
          category: 'maintainability'
        }],
        suggestions: [],
        missingComponents: [],
        architectureStrengths: [],
        improvements: []
      });
    } finally {
      setIsAssessing(false);
    }
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



  function updateEdgeLabel(eds: Edge[], id: string, label: string, hasLabel: boolean) {
    return eds.map((edge) => edge.id === id ? { ...edge, data: { ...edge.data, label, hasLabel }, label } : edge);
  }

  const edgeLabelChangeHandlerRef = React.useRef<((e: Event) => void) | undefined>(undefined);
  edgeLabelChangeHandlerRef.current = (e: Event) => {
    const ce = e as CustomEvent;
    const { id, label, hasLabel } = ce.detail as { id: string; label: string; hasLabel: boolean };
    setEdges((eds) => updateEdgeLabel(eds, id, label, hasLabel));
  };

  React.useEffect(() => {
    const listener = (e: Event) => edgeLabelChangeHandlerRef.current?.(e);
    globalThis.addEventListener("diagram:edge-label-change", listener as EventListener);
    return () => globalThis.removeEventListener("diagram:edge-label-change", listener as EventListener);
  }, []);

  // register window event listeners once (mount/unmount)
  React.useEffect(() => {
    const deleteListener = (e: Event) =>
      handleDiagramNodeDeleteRef.current?.(e);
    const toggleListener = (e: Event) =>
      handleDiagramNodeToggleRef.current?.(e);
    globalThis.addEventListener(
      "diagram:node-delete",
      deleteListener as EventListener
    );
    globalThis.addEventListener(
      "diagram:node-toggle",
      toggleListener as EventListener
    );
    return () => {
      globalThis.removeEventListener(
        "diagram:node-delete",
        deleteListener as EventListener
      );
      globalThis.removeEventListener(
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
  const updateNodeProperty = (key: string, value: string | number | boolean) => {
    setNodeProps((s) => ({ ...s, [key]: value }));
    // Auto-save property changes to node data
    if (inspectedNodeId) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === inspectedNodeId
            ? { ...n, data: { ...n.data, [key]: value } }
            : n
        )
      );
    }
  };

  const setPropBoolean = (key: string, value: boolean) => updateNodeProperty(key, value);
  const setPropNumber = (key: string, value: number) => updateNodeProperty(key, value);
  const setPropString = (key: string, value: string) => updateNodeProperty(key, value);
  const setPropSelect = (key: string, value: string) => updateNodeProperty(key, value);

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
    } else if (p.default === null || p.default === undefined) {
      stringValue = "";
    } else {
      stringValue = String(p.default);
    }

    let selectValue: string | undefined;
    if (typeof raw === "string") {
      selectValue = raw;
    } else if (p.default === null || p.default === undefined) {
      selectValue = undefined;
    } else {
      selectValue = String(p.default);
    }

    const checkedValue: boolean = Boolean(raw);

    return (
      <div key={p.key} className="flex flex-col px-1">
        {p.type === "boolean" && (
          <AnimatedCheckbox
            id={inputId}
            checked={checkedValue}
            onChange={(val) => setPropBoolean(p.key, val)}
            label={p.label}
          />
        )}
        {p.type === "number" && (
          <AnimatedNumberInput
            id={inputId}
            label={p.label}
            value={numberValue}
            onChange={(val) => setPropNumber(p.key, val)}
          />
        )}
        {p.type === "text" && (
          <AnimatedTextInput
            id={inputId}
            label={p.label}
            value={stringValue}
            placeholder={p.placeholder}
            onChange={(val) => setPropString(p.key, val)}
          />
        )}
        {p.type === "textarea" && (
          <AnimatedTextarea
            id={inputId}
            label={p.label}
            value={stringValue}
            placeholder={p.placeholder}
            onChange={(v) => setPropString(p.key, v)}
          />
        )}
        {p.type === "select" && (
          <AnimatedSelect
            id={inputId}
            label={p.label}
            value={selectValue}
            options={p.options || []}
            onChange={(v) => setPropSelect(p.key, v)}
          />
        )}
      </div>
    );
  };

  // compute property elements once to avoid inline IIFE and deep nesting inside JSX
  let propertyElements: React.ReactNode = null;
  if (inspectedNodeId) {
    const node = nodes.find((n) => n.id === inspectedNodeId);
    if (node) {
      const comp = COMPONENTS.find((c) => c.label === node.data.label);
      if (comp?.properties) {
        propertyElements = comp.properties.map((p: ComponentProperty) =>
          renderProperty(p)
        );
      } else {
        propertyElements = (
          <div className="text-sm text-muted">No properties defined</div>
        );
      }
    } else { 
      propertyElements = (
        <div className="text-sm text-muted">Node not found</div>
      );
    }
  }

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-theme flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-theme mb-4">
            Loading problem...
          </h2>
          <div className="text-muted">
            Please wait while we fetch the problem details
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-theme flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-theme mb-4">
            Error Loading Problem
          </h2>
          <div className="text-muted mb-4">
            {error}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-accent text-white rounded-md hover:brightness-90"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => globalThis.location.reload()}
              className="px-4 py-2 bg-surface border border-theme text-theme rounded-md hover:bg-[var(--bg-hover)]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where no problem is found
  if (!problem) {
    return (
      <div className="min-h-screen bg-theme flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-theme mb-4">
            Problem not found
          </h2>
          <div className="text-muted mb-4">
            The requested problem could not be found.
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-accent text-white rounded-md hover:brightness-90"
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

  // handle copying a node
  const handleNodeCopy = (id: string, data: NodeData) => {
    const originalNode = nodes.find(n => n.id === id);
    if (!originalNode) return;

    // Create a new node with copied data but new position and ID
    const newNodeId = `${id}-copy-${Date.now()}`;
    const newNode: Node = {
      ...originalNode,
      id: newNodeId,
      position: {
        x: originalNode.position.x + 200, // Larger offset to prevent overlap
        y: originalNode.position.y + 100,
      },
      data: { ...data },
      selected: false, // Ensure the copied node is not selected
    };

    setNodes((nds) => [...nds, newNode]);
  };

  // register node and edge types
  const nodeTypes = { 
    custom: createNodeWithCopyHandler(handleNodeCopy)
  };
  const edgeTypes = { customEdge: CustomEdge };

  // persist nodeProps back into node data (manual save - now mainly for debugging)
  const handleSave = () => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === inspectedNodeId
          ? { ...n, data: { ...n.data, ...nodeProps } }
          : n
      )
    );
    
    // Log current node data for debugging
    if (inspectedNodeId) {
      const node = nodes.find(n => n.id === inspectedNodeId);
      console.log('Node properties saved:', {
        id: inspectedNodeId,
        data: node?.data,
        nodeProps
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-theme">
      {/* Header */}
      <div className="bg-surface shadow-sm border-b border-theme px-4 py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="px-3 py-2 text-muted hover:text-theme hover:bg-[var(--bg-hover)] rounded-md transition-colors cursor-pointer"
            >
              ← Back to Dashboard
            </button>
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-semibold text-theme">
                {problem.title}
              </h1>
              <span className={`px-2 py-1 rounded text-xs ${difficultyBadgeClass}`}>
                {problem.difficulty}
              </span>
              <span className="text-sm text-muted">{problem.estimated_time}</span>
              <span className="text-sm text-muted">•</span>
              <span className="text-sm text-muted">{problem.category}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeSwitcher />
            <button
              type="button"
              onClick={runAssessment}
              disabled={isAssessing}
              className="px-6 py-1 bg-[var(--brand)] text-white font-bold rounded-md hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Run assessment on current design"
            >
              {isAssessing ? 'Assessing...' : 'Run Assessment'}
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
          edgeTypes={edgeTypes}
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
