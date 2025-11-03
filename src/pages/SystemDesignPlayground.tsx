import React, { useRef, useState, useEffect, useCallback } from "react";
import AnimatedCheckbox from "../components/shared/AnimatedCheckbox";
import {
  AnimatedNumberInput,
  AnimatedTextInput,
  AnimatedTextarea,
  AnimatedSelect,
} from "../components/shared/AnimatedInputFields";
import type {
  SystemDesignProblem,
  SystemDesignSolution,
  ValidationResult,
  ComponentType,
  ConnectionType,
} from "../types/systemDesign";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useTheme } from "../hooks/useTheme";
import { useUndoRedo } from "../hooks/useUndoRedo";
import {
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  getNodesBounds,
  getViewportForBounds,
} from "@xyflow/react";
import type { Node, Edge, Connection } from "@xyflow/react";
import { toPng, toJpeg, toSvg } from "html-to-image";
import dagre from "dagre";
import { COMPONENTS } from "../config/components";
import ComponentPalette from "../components/ComponentPalette";
import DiagramCanvas from "../components/DiagramCanvas";
import InspectorPanel from "../components/InspectorPanel";
import type { ComponentProperty } from "../types/canvas";
import { useNavigate, useParams } from "react-router-dom";
import SEO from "../components/SEO";
import assessSolution from "../utils/assessor";
import CustomNode from "../components/Node";
import type { NodeData } from "../components/Node";
import CustomEdge from "../components/CustomEdge";
import GroupNode from "../components/GroupNode";
import CustomPropertyInput, {
  type CustomProperty,
} from "../components/CustomPropertyInput";
import { useAuth } from "../hooks/useAuth";
import { AuthModal } from "../components/AuthModal";
import { DiagramListModal } from "../components/DiagramListModal";
import { apiService } from "../services/api";
import type { SavedDiagram } from "../types/auth";
import { useToast } from "../hooks/useToast";
import { ToastContainer } from "../components/Toast";
import { InputDialog } from "../components/InputDialog";

interface SystemDesignPlaygroundProps {
  problem?: SystemDesignProblem | null;
  onBack?: () => void;
}

// Create a wrapper component for CustomNode with onCopy prop
const NodeWithCopy = React.memo(
  (props: {
    id: string;
    data: unknown;
    onCopy: (id: string, data: NodeData) => void;
    isInGroup?: boolean;
  }) => {
    const nodeData = props.data as NodeData;
    return (
      <CustomNode
        id={props.id}
        data={nodeData}
        onCopy={props.onCopy}
        isInGroup={props.isInGroup}
      />
    );
  },
);

// Factory function to create node component with copy handler and group detection
const createNodeWithCopyHandler = (
  onCopy: (id: string, data: NodeData) => void,
  nodes: Node[],
) => {
  return (props: { id: string; data: unknown }) => {
    const isInGroup =
      nodes.find((n) => n.id === props.id)?.parentId !== undefined;
    return <NodeWithCopy {...props} onCopy={onCopy} isInGroup={isInGroup} />;
  };
};

const SystemDesignPlayground: React.FC<SystemDesignPlaygroundProps> = () => {
  useTheme();
  const navigate = useNavigate();
  const params = useParams();
  const idFromUrl = params?.id;
  const { screenToFlowPosition } = useReactFlow();
  const { user, isAuthenticated, login, signup, googleLogin, logout } =
    useAuth();

  // Toast notifications
  const toast = useToast();

  // Input dialog state
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [inputDialogConfig, setInputDialogConfig] = useState<{
    title: string;
    label: string;
    placeholder?: string;
    defaultValue?: string;
    type?: 'text' | 'textarea';
    required?: boolean;
    onConfirm: (value: string) => void;
  } | null>(null);

  // Get diagramId from query parameters
  const searchParams = new URLSearchParams(globalThis.location.hash.split('?')[1]);
  const diagramIdFromUrl = searchParams.get('diagramId');

  // State for problem data
  const [problem, setProblem] = useState<SystemDesignProblem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Auth and diagram management state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDiagramList, setShowDiagramList] = useState(false);
  const [savedDiagrams, setSavedDiagrams] = useState<SavedDiagram[]>([]);
  const [loadingDiagrams, setLoadingDiagrams] = useState(false);
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Fetch problem from API or localStorage
  useEffect(() => {
    if (!idFromUrl) {
      setLoading(false);
      setError("No problem ID provided");
      return;
    }

    // Handle "free" mode - no problem, just canvas
    if (idFromUrl === "free") {
      setProblem({
        id: "free",
        title: "Design Studio",
        description: "Create your own system design from scratch",
        difficulty: "Medium",
        category: "Custom",
        estimated_time: "Unlimited",
        requirements: [],
        constraints: [],
        hints: [],
        tags: ["custom", "free-design"],
      });
      setLoading(false);
      return;
    }

    // Check if it's a custom problem from localStorage
    if (idFromUrl.startsWith("custom-")) {
      const customProblemData = localStorage.getItem(
        `custom-problem-${idFromUrl}`,
      );
      if (customProblemData) {
        setProblem(JSON.parse(customProblemData));
        setLoading(false);
        return;
      }
    }

    const fetchProblem = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiUrl =
          import.meta.env.VITE_ASSESSMENT_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl}/api/v1/problem/${idFromUrl}`);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch problem: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        setProblem(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching the problem",
        );
        console.error("Error fetching problem:", err);
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

  // Undo/Redo state management
  interface CanvasState {
    nodes: Node[];
    edges: Edge[];
  }

  const {
    state: canvasState,
    setState: setCanvasState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<CanvasState>({
    nodes: [],
    edges: [],
  });

  // Use React Flow's state hooks but sync with undo/redo
  const [nodes, setNodes, onNodesChange] = useNodesState(canvasState.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(canvasState.edges);
  const { getNodes, fitView } = useReactFlow();

  // State for download menu
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  // State for layout menu
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  // Load diagram from URL parameter if diagramId is present
  useEffect(() => {
    if (!diagramIdFromUrl || !isAuthenticated) return;

    const loadDiagramFromUrl = async () => {
      try {
        const diagram = await apiService.getDiagram(diagramIdFromUrl);
        const loadedNodes = diagram.nodes as Node[];
        const loadedEdges = diagram.edges as Edge[];
        
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setCurrentDiagramId(diagram.id);
        
        // Immediately update canvas state to prevent undo/redo from clearing the loaded data
        setCanvasState({ nodes: loadedNodes, edges: loadedEdges });
      } catch (err) {
        console.error("Failed to load diagram:", err);
        toast.error("Failed to load diagram. It may have been deleted or you don't have access to it.");
      }
    };

    loadDiagramFromUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagramIdFromUrl, isAuthenticated]);

  // Sync canvas state to undo/redo history when nodes or edges change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCanvasState({ nodes, edges });
    }, 300); // Debounce to avoid too many history entries during dragging

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, setCanvasState]);

  // Apply undo/redo state to React Flow
  useEffect(() => {
    setNodes(canvasState.nodes);
    setEdges(canvasState.edges);
  }, [canvasState, setNodes, setEdges]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Shift+Z or Cmd+Shift+Z or Ctrl+Y for redo
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") ||
        (e.ctrlKey && e.key === "y")
      ) {
        e.preventDefault();
        redo();
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showDownloadMenu) {
        const target = e.target as HTMLElement;
        if (!target.closest(".relative")) {
          setShowDownloadMenu(false);
        }
      }
    };

    if (showDownloadMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showDownloadMenu]);

  // Close layout menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showLayoutMenu) {
        const target = e.target as HTMLElement;
        if (!target.closest(".relative")) {
          setShowLayoutMenu(false);
        }
      }
    };

    if (showLayoutMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showLayoutMenu]);

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
    null,
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
        const allProperties =
          dataObj && typeof dataObj === "object"
            ? ({ ...dataObj } as Record<string, unknown>)
            : ({} as Record<string, unknown>);

        // Remove system properties from the properties object
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
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
            },
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
      console.log("Running AI assessment with solution:", solution);

      // Call AI assessor (now returns Promise) with problem context
      const res = await assessSolution(solution, problem);
      setAssessment(res);
      setActiveRightTab("details");
    } catch (error) {
      console.error("Assessment failed:", error);
      setAssessment({
        isValid: false,
        score: 0,
        feedback: [
          {
            type: "error",
            message:
              "Assessment failed. Please check your connection and try again.",
            category: "maintainability",
          },
        ],
        suggestions: [],
        missingComponents: [],
        architectureStrengths: [],
        improvements: [],
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

    // Use screenToFlowPosition to properly convert screen coordinates to flow coordinates
    // This accounts for zoom and pan transformations
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const id = `${type}-${Date.now()}`;
    const comp = COMPONENTS.find((c) => c.id === type);

    // Check if it's a group/cluster component
    const isGroupComponent = comp?.group === "Grouping";

    const newNode: Node = {
      id,
      position,
      type: isGroupComponent ? "group" : "custom",
      // For group nodes, use different styling
      style: isGroupComponent
        ? {
            width: 400,
            height: 300,
            zIndex: -1, // Groups should be behind regular nodes
          }
        : undefined,
      // include icon so the custom node can render it
      data: {
        label: comp?.label ?? type,
        componentId: comp?.id, // Store the original component ID
        icon: comp?.icon,
        subtitle: comp?.description,
        backgroundColor: isGroupComponent
          ? "rgba(100, 100, 255, 0.05)"
          : undefined,
        borderColor: isGroupComponent ? "rgba(100, 100, 255, 0.3)" : undefined,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  // Handle node drag stop to assign parent-child relationships with groups
  const onNodeDragStop = (_event: React.MouseEvent, node: Node) => {
    // Only allow attaching nodes to groups, NOT detaching
    // Detachment can only be done via the explicit detach buttons

    // Skip if node already has a parent - they can only detach via buttons
    if (node.parentId) return;

    // Find if the node is being dragged over a group node
    const groupNodes = nodes.filter((n) => n.type === "group");

    // Check if node is inside any group
    let newParentId: string | undefined = undefined;

    for (const groupNode of groupNodes) {
      if (groupNode.id === node.id) continue; // Skip if dragging the group itself

      const groupX = groupNode.position.x;
      const groupY = groupNode.position.y;
      const groupWidth = (groupNode.style?.width as number) || 400;
      const groupHeight = (groupNode.style?.height as number) || 300;

      // Get absolute position of the node
      const nodeAbsX = node.position.x;
      const nodeAbsY = node.position.y;

      // Check if node is within group bounds (with some padding for better UX)
      const padding = 10;
      if (
        nodeAbsX > groupX + padding &&
        nodeAbsX < groupX + groupWidth - padding &&
        nodeAbsY > groupY + padding &&
        nodeAbsY < groupY + groupHeight - padding
      ) {
        newParentId = groupNode.id;
        break;
      }
    }

    // Only attach if we found a new parent
    if (newParentId) {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            // Calculate position relative to the new parent
            const newParent = nds.find((gn) => gn.id === newParentId);
            const newPosition = newParent
              ? {
                  x: node.position.x - newParent.position.x,
                  y: node.position.y - newParent.position.y,
                }
              : node.position;

            return {
              ...n,
              position: newPosition,
              parentId: newParentId,
              extent: "parent" as const,
            };
          }
          return n;
        }),
      );
    }
  };

  // Handle detaching a node from its parent group
  const handleDetachFromGroup = useCallback(() => {
    const nodeId = inspectedNodeIdRef.current;
    if (!nodeId) return;

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId && n.parentId) {
          // Calculate absolute position before detaching
          const parent = nds.find((p) => p.id === n.parentId);
          let absX = n.position.x;
          let absY = n.position.y;

          if (parent) {
            absX += parent.position.x;
            absY += parent.position.y;
          }

          return {
            ...n,
            position: { x: absX, y: absY },
            parentId: undefined,
            extent: undefined,
          };
        }
        return n;
      }),
    );
  }, [setNodes]);

  // inspector state
  const [inspectedNodeId, setInspectedNodeId] = useState<string | null>(null);
  type NodeProps = Record<string, string | number | boolean | undefined>;
  const [nodeProps, setNodeProps] = useState<NodeProps>({});
  // Custom properties state - stores custom properties per node
  const [customProperties, setCustomProperties] = useState<
    Record<string, CustomProperty[]>
  >({});
  // which tab is active in the right sidebar: 'details' or 'inspector'
  const [activeRightTab, setActiveRightTab] = useState<"details" | "inspector">(
    "details",
  );
  // Clear canvas confirmation state
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ref to hold latest inspectedNodeId for event handlers to read without adding deps
  const inspectedNodeIdRef = useRef<string | null>(null);
  React.useEffect(() => {
    inspectedNodeIdRef.current = inspectedNodeId;
  }, [inspectedNodeId]);

  // handlers moved outside the effect to reduce nesting depth. Use refs to keep stable references.
  const handleDiagramNodeDeleteRef = useRef<((e: Event) => void) | undefined>(
    undefined,
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
    undefined,
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

  function updateEdgeLabel(
    eds: Edge[],
    id: string,
    label: string,
    hasLabel: boolean,
  ) {
    return eds.map((edge) =>
      edge.id === id
        ? { ...edge, data: { ...edge.data, label, hasLabel }, label }
        : edge,
    );
  }

  const edgeLabelChangeHandlerRef = React.useRef<
    ((e: Event) => void) | undefined
  >(undefined);
  edgeLabelChangeHandlerRef.current = (e: Event) => {
    const ce = e as CustomEvent;
    const { id, label, hasLabel } = ce.detail as {
      id: string;
      label: string;
      hasLabel: boolean;
    };
    setEdges((eds) => updateEdgeLabel(eds, id, label, hasLabel));
  };

  React.useEffect(() => {
    const listener = (e: Event) => edgeLabelChangeHandlerRef.current?.(e);
    globalThis.addEventListener(
      "diagram:edge-label-change",
      listener as EventListener,
    );
    return () =>
      globalThis.removeEventListener(
        "diagram:edge-label-change",
        listener as EventListener,
      );
  }, []);

  // register window event listeners once (mount/unmount)
  React.useEffect(() => {
    const deleteListener = (e: Event) =>
      handleDiagramNodeDeleteRef.current?.(e);
    const toggleListener = (e: Event) =>
      handleDiagramNodeToggleRef.current?.(e);
    const detachListener = (e: Event) => {
      const evt = e as CustomEvent<{ id: string }>;
      // Detach the node from its parent group
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === evt.detail.id && n.parentId) {
            // Calculate absolute position before detaching
            const parent = nds.find((p) => p.id === n.parentId);
            let absX = n.position.x;
            let absY = n.position.y;

            if (parent) {
              absX += parent.position.x;
              absY += parent.position.y;
            }

            return {
              ...n,
              position: { x: absX, y: absY },
              parentId: undefined,
              extent: undefined,
            };
          }
          return n;
        }),
      );
    };

    globalThis.addEventListener(
      "diagram:node-delete",
      deleteListener as EventListener,
    );
    globalThis.addEventListener(
      "diagram:node-toggle",
      toggleListener as EventListener,
    );
    globalThis.addEventListener(
      "diagram:node-detach",
      detachListener as EventListener,
    );
    return () => {
      globalThis.removeEventListener(
        "diagram:node-delete",
        deleteListener as EventListener,
      );
      globalThis.removeEventListener(
        "diagram:node-toggle",
        toggleListener as EventListener,
      );
      globalThis.removeEventListener(
        "diagram:node-detach",
        detachListener as EventListener,
      );
    };
  }, [setNodes]);

  React.useEffect(() => {
    if (!inspectedNodeId) return;
    const n = nodes.find((x) => x.id === inspectedNodeId);
    setNodeProps((n?.data ?? {}) as NodeProps);
  }, [inspectedNodeId, nodes]);

  // --- Helpers to reduce nested function depth in JSX ---
  const updateNodeProperty = (
    key: string,
    value: string | number | boolean,
  ) => {
    setNodeProps((s) => ({ ...s, [key]: value }));
    // Auto-save property changes to node data
    if (inspectedNodeId) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === inspectedNodeId
            ? { ...n, data: { ...n.data, [key]: value } }
            : n,
        ),
      );
    }
  };

  const setPropBoolean = (key: string, value: boolean) =>
    updateNodeProperty(key, value);
  const setPropNumber = (key: string, value: number) =>
    updateNodeProperty(key, value);
  const setPropString = (key: string, value: string) =>
    updateNodeProperty(key, value);
  const setPropSelect = (key: string, value: string) =>
    updateNodeProperty(key, value);

  // --- Custom Property Handlers ---
  const handleAddCustomProperty = () => {
    if (!inspectedNodeId) return;

    const newProperty: CustomProperty = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      key: `customProperty${(customProperties[inspectedNodeId]?.length || 0) + 1}`,
      label: `Custom Property ${(customProperties[inspectedNodeId]?.length || 0) + 1}`,
      type: "text",
      value: "",
    };

    setCustomProperties((prev) => {
      const updated = {
        ...prev,
        [inspectedNodeId]: [...(prev[inspectedNodeId] || []), newProperty],
      };

      // Save to node data
      setNodes((nds) =>
        nds.map((n) =>
          n.id === inspectedNodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  _customProperties: updated[inspectedNodeId],
                },
              }
            : n,
        ),
      );

      return updated;
    });
  };

  const handleUpdateCustomProperty = (
    id: string,
    updates: Partial<CustomProperty>,
  ) => {
    if (!inspectedNodeId) return;

    setCustomProperties((prev) => {
      const nodeCustomProps = prev[inspectedNodeId] || [];
      const updated = nodeCustomProps.map((prop) =>
        prop.id === id ? { ...prop, ...updates } : prop,
      );

      // Save to node data
      setNodes((nds) =>
        nds.map((n) =>
          n.id === inspectedNodeId
            ? { ...n, data: { ...n.data, _customProperties: updated } }
            : n,
        ),
      );

      return {
        ...prev,
        [inspectedNodeId]: updated,
      };
    });
  };

  const handleDeleteCustomProperty = (id: string) => {
    if (!inspectedNodeId) return;

    setCustomProperties((prev) => {
      const nodeCustomProps = prev[inspectedNodeId] || [];
      const filtered = nodeCustomProps.filter((prop) => prop.id !== id);

      // Save to node data
      setNodes((nds) =>
        nds.map((n) =>
          n.id === inspectedNodeId
            ? { ...n, data: { ...n.data, _customProperties: filtered } }
            : n,
        ),
      );

      return {
        ...prev,
        [inspectedNodeId]: filtered,
      };
    });
  };

  // Load custom properties when inspecting a node
  React.useEffect(() => {
    if (!inspectedNodeId) return;
    const node = nodes.find((n) => n.id === inspectedNodeId);
    if (node?.data?._customProperties) {
      setCustomProperties((prev) => ({
        ...prev,
        [inspectedNodeId]: node.data._customProperties as CustomProperty[],
      }));
    }
  }, [inspectedNodeId, nodes]);

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
      // Find the component definition using componentId or label
      const comp = node.data.componentId
        ? COMPONENTS.find((c) => c.id === node.data.componentId)
        : COMPONENTS.find((c) => c.label === node.data.label);

      if (comp?.properties) {
        propertyElements = comp.properties.map((p: ComponentProperty) =>
          renderProperty(p),
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

  // Render custom property elements
  let customPropertyElements: React.ReactNode = null;
  if (inspectedNodeId) {
    const nodeCustomProps = customProperties[inspectedNodeId] || [];
    if (nodeCustomProps.length > 0) {
      customPropertyElements = nodeCustomProps.map((prop) => (
        <CustomPropertyInput
          key={prop.id}
          property={prop}
          onUpdate={handleUpdateCustomProperty}
          onDelete={handleDeleteCustomProperty}
        />
      ));
    } else {
      customPropertyElements = (
        <div className="text-xs text-muted text-center py-3">
          No custom properties added yet
        </div>
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
          <div className="text-muted mb-4">{error}</div>
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
    // Place newly added node in the center of the visible viewport
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!bounds) return;

    // Convert the center of the viewport to flow coordinates
    const position = screenToFlowPosition({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    });

    const nodeId = `${id}-${Date.now()}`;

    // Check if it's a group/cluster component
    const isGroupComponent = comp?.group === "Grouping";

    const newNode: Node = {
      id: nodeId,
      position,
      type: isGroupComponent ? "group" : "custom",
      style: isGroupComponent
        ? {
            width: 400,
            height: 300,
            zIndex: -1,
          }
        : undefined,
      data: {
        label: comp?.label ?? id,
        componentId: comp?.id, // Store the original component ID
        icon: comp?.icon,
        subtitle: comp?.description,
        backgroundColor: isGroupComponent
          ? "rgba(100, 100, 255, 0.05)"
          : undefined,
        borderColor: isGroupComponent ? "rgba(100, 100, 255, 0.3)" : undefined,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }

  // handle copying a node
  const handleNodeCopy = (id: string, data: NodeData) => {
    const originalNode = nodes.find((n) => n.id === id);
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

  // Clear all nodes and edges from canvas
  const handleClearCanvas = () => {
    if (nodes.length === 0 && edges.length === 0) {
      return; // Nothing to clear
    }
    setShowClearConfirm(true);
  };

  const confirmClearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setInspectedNodeId(null);
    setAssessment(null);
    setShowClearConfirm(false);
  };

  const cancelClearCanvas = () => {
    setShowClearConfirm(false);
  };

  // Download canvas as image
  const downloadImage = (format: "png" | "jpeg" | "svg" = "png") => {
    const nodesBounds = getNodesBounds(getNodes());
    const viewport = getViewportForBounds(nodesBounds, 1024, 768, 0.5, 2, 0.2);

    const viewportElement = document.querySelector(
      ".react-flow__viewport",
    ) as HTMLElement;

    if (!viewportElement) {
      console.error("Viewport element not found");
      return;
    }

    let downloadFunc;
    let fileExtension;

    if (format === "svg") {
      downloadFunc = toSvg;
      fileExtension = "svg";
    } else if (format === "jpeg") {
      downloadFunc = toJpeg;
      fileExtension = "jpg";
    } else {
      downloadFunc = toPng;
      fileExtension = "png";
    }

    downloadFunc(viewportElement, {
      backgroundColor: format === "png" ? "transparent" : "#ffffff",
      width: 1024,
      height: 768,
      style: {
        width: `${1024}px`,
        height: `${768}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    })
      .then((dataUrl) => {
        const a = document.createElement("a");
        a.setAttribute(
          "download",
          `system-design-${Date.now()}.${fileExtension}`,
        );
        a.setAttribute("href", dataUrl);
        a.click();
      })
      .catch((error) => {
        console.error("Error generating image:", error);
      });
  };

  // Diagram management handlers
  const handleSaveDiagram = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Show input dialog for title
    setInputDialogConfig({
      title: 'Save Design',
      label: 'Design Title',
      placeholder: 'Enter a title for this diagram',
      defaultValue: currentDiagramId ? 'Untitled Diagram' : '',
      required: true,
      onConfirm: (title) => {
        // Close current dialog first, then open description dialog
        setShowInputDialog(false);
        
        // Use setTimeout to ensure dialog closes before opening new one
        setTimeout(() => {
          setInputDialogConfig({
            title: 'Save Design',
            label: 'Description (Optional)',
            placeholder: 'Enter a description for this diagram',
            type: 'textarea',
            required: false,
            onConfirm: (description) => {
              // Close the dialog
              setShowInputDialog(false);
              
              // Use void to wrap the async operation
              void (async () => {
                try {
                  if (currentDiagramId) {
                    // Update existing diagram
                    await apiService.updateDiagram(currentDiagramId, {
                      title,
                      description: description || undefined,
                      nodes,
                      edges,
                    });
                    toast.success("Diagram updated successfully!");
                  } else {
                    // Save new diagram
                    const saved = await apiService.saveDiagram({
                      title,
                      description: description || undefined,
                      nodes,
                      edges,
                    });
                    setCurrentDiagramId(saved.id);
                    toast.success("Diagram saved successfully!");
                  }
                } catch (err) {
                  console.error("Failed to Save Design:", err);
                  toast.error(err instanceof Error ? err.message : "Failed to Save Design");
                }
              })();
            },
          });
          setShowInputDialog(true);
        }, 100);
      },
    });
    setShowInputDialog(true);
  };

  const handleLoadDiagrams = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setLoadingDiagrams(true);
    try {
      const diagrams = await apiService.getUserDiagrams();
      setSavedDiagrams(diagrams);
      setShowDiagramList(true);
    } catch (err) {
      console.error("Failed to load diagrams:", err);
      toast.error("Failed to load diagrams");
    } finally {
      setLoadingDiagrams(false);
    }
  };

  const handleLoadDiagram = (diagram: SavedDiagram) => {
    setNodes(diagram.nodes as Node[]);
    setEdges(diagram.edges as Edge[]);
    setCurrentDiagramId(diagram.id);
  };

  const handleDeleteDiagram = async (id: string) => {
    try {
      await apiService.deleteDiagram(id);
      setSavedDiagrams((prev) => prev.filter((d) => d.id !== id));
      if (currentDiagramId === id) {
        setCurrentDiagramId(null);
      }
    } catch (err) {
      console.error("Failed to delete diagram:", err);
      throw err;
    }
  };

  // Auto-layout nodes using Dagre with proper group handling
  const onLayout = (direction: "TB" | "LR" = "TB") => {
    // Separate groups and regular nodes
    const groupNodes = nodes.filter((node) => node.type === "group");
    const regularNodes = nodes.filter(
      (node) => node.type !== "group" && !node.parentId,
    );

    // First, layout groups with larger spacing
    const groupGraph = new dagre.graphlib.Graph();
    groupGraph.setDefaultEdgeLabel(() => ({}));
    groupGraph.setGraph({
      rankdir: direction,
      nodesep: 150, // More space between groups
      ranksep: 200, // More vertical space
      marginx: 50,
      marginy: 50,
    });

    const groupWidth = 350;
    const groupHeight = 250;

    for (const node of groupNodes) {
      groupGraph.setNode(node.id, { width: groupWidth, height: groupHeight });
    }

    // Add edges between groups (if any)
    const groupEdges = edges.filter(
      (edge) =>
        groupNodes.some((g) => g.id === edge.source) &&
        groupNodes.some((g) => g.id === edge.target),
    );
    for (const edge of groupEdges) {
      groupGraph.setEdge(edge.source, edge.target);
    }

    if (groupNodes.length > 0) {
      dagre.layout(groupGraph);
    }

    // Layout regular nodes (non-grouped)
    const regularGraph = new dagre.graphlib.Graph();
    regularGraph.setDefaultEdgeLabel(() => ({}));
    regularGraph.setGraph({
      rankdir: direction,
      nodesep: 80,
      ranksep: 100,
    });

    const nodeWidth = 200;
    const nodeHeight = 80;

    for (const node of regularNodes) {
      regularGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    }

    // Add edges between regular nodes
    // Add edges between regular nodes
    const regularEdges = edges.filter(
      (edge) =>
        regularNodes.some((n) => n.id === edge.source) &&
        regularNodes.some((n) => n.id === edge.target),
    );
    for (const edge of regularEdges) {
      regularGraph.setEdge(edge.source, edge.target);
    }
    if (regularNodes.length > 0) {
      dagre.layout(regularGraph);
    }

    // Apply positions
    const layoutedNodes = nodes.map((node) => {
      if (node.type === "group") {
        // Position group nodes
        const nodeWithPosition = groupGraph.node(node.id);
        if (nodeWithPosition) {
          return {
            ...node,
            position: {
              x: nodeWithPosition.x - groupWidth / 2,
              y: nodeWithPosition.y - groupHeight / 2,
            },
          };
        }
      } else if (node.parentId) {
        // Keep child nodes in their relative positions within groups
        return node;
      } else {
        // Position regular nodes
        const nodeWithPosition = regularGraph.node(node.id);
        if (nodeWithPosition) {
          // Offset regular nodes to avoid group area
          const offsetX = groupNodes.length > 0 ? groupWidth + 100 : 0;
          return {
            ...node,
            position: {
              x: nodeWithPosition.x - nodeWidth / 2 + offsetX,
              y: nodeWithPosition.y - nodeHeight / 2,
            },
          };
        }
      }
      return node;
    });

    setNodes(layoutedNodes);

    // Fit view after layout with some padding
    globalThis.requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 400 });
    });
  };

  // register node and edge types
  const nodeTypes = {
    custom: createNodeWithCopyHandler(handleNodeCopy, nodes),
    group: GroupNode,
  };
  const edgeTypes = { customEdge: CustomEdge };

  // persist nodeProps back into node data (manual save - now mainly for debugging)
  const handleSave = () => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === inspectedNodeId
          ? { ...n, data: { ...n.data, ...nodeProps } }
          : n,
      ),
    );

    // Log current node data for debugging
    if (inspectedNodeId) {
      const node = nodes.find((n) => n.id === inspectedNodeId);
      console.log("Node properties saved:", {
        id: inspectedNodeId,
        data: node?.data,
        nodeProps,
      });
    }
  };

  const pageTitle =
    idFromUrl === "free"
      ? "Design Studio | Diagrammatic"
      : `${problem?.title || "System Design Challenge"} | Diagrammatic`;

  const pageDescription =
    idFromUrl === "free"
      ? "Create system architecture diagrams from scratch with our free interactive canvas. Design, prototype, and visualize your ideas with 45+ components."
      : `Solve the ${problem?.title || "system design"} challenge. ${problem?.description?.substring(0, 150) || "Practice system design skills"}...`;

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={`system design playground, ${problem?.title || "free canvas"}, architecture diagram tool, ${problem?.category || "design tool"}`}
        url={`https://satya00089.github.io/diagrammatic/#/playground/${idFromUrl || "free"}`}
      />
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
                <span
                  className={`px-2 py-1 rounded text-xs ${difficultyBadgeClass}`}
                >
                  {problem.difficulty}
                </span>
                <span className="text-sm text-muted">
                  {problem.estimated_time}
                </span>
                <span className="text-sm text-muted">•</span>
                <span className="text-sm text-muted">{problem.category}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Undo/Redo buttons */}
              <div className="flex items-center border-r border-theme/10 pr-2 mr-2">
                <button
                  type="button"
                  onClick={undo}
                  disabled={!canUndo}
                  className="p-2 text-muted hover:text-theme hover:bg-[var(--bg-hover)] rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Undo (Ctrl+Z)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={redo}
                  disabled={!canRedo}
                  className="p-2 text-muted hover:text-theme hover:bg-[var(--bg-hover)] rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
                    />
                  </svg>
                </button>
              </div>

              {/* Clear Canvas button */}
              <button
                type="button"
                onClick={handleClearCanvas}
                disabled={nodes.length === 0 && edges.length === 0}
                className="p-2 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer border-r border-theme/10 pr-2 mr-2"
                title="Clear Canvas"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Download Image button with dropdown */}
              <div className="relative border-r border-theme/10 pr-2 mr-2">
                <button
                  type="button"
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  disabled={nodes.length === 0}
                  className="p-2 text-muted hover:text-theme hover:bg-[var(--bg-hover)] rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Download as Image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>

                {/* Download format dropdown */}
                {showDownloadMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-surface shadow-lg rounded-lg border border-theme/10 py-1 z-50 min-w-[120px]">
                    <button
                      type="button"
                      onClick={() => {
                        downloadImage("png");
                        setShowDownloadMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-theme hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                    >
                      PNG
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        downloadImage("jpeg");
                        setShowDownloadMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-theme hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                    >
                      JPEG
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        downloadImage("svg");
                        setShowDownloadMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-theme hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                    >
                      SVG
                    </button>
                  </div>
                )}
              </div>

              {/* Layout button with dropdown */}
              <div className="relative border-r border-theme/10 pr-2 mr-2">
                <button
                  type="button"
                  onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                  disabled={nodes.length === 0}
                  className="p-2 text-muted hover:text-theme hover:bg-[var(--bg-hover)] rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Auto Layout"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
                    />
                  </svg>
                </button>

                {/* Layout direction dropdown */}
                {showLayoutMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-surface shadow-lg rounded-lg border border-theme/10 py-1 z-50 min-w-[160px]">
                    <button
                      type="button"
                      onClick={() => {
                        onLayout("TB");
                        setShowLayoutMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-theme hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                    >
                      Vertical Layout
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onLayout("LR");
                        setShowLayoutMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-theme hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                    >
                      Horizontal Layout
                    </button>
                  </div>
                )}
              </div>

              {/* Diagram Management Buttons (only for free mode and authenticated users) */}
              {idFromUrl === "free" && (
                <div className="flex items-center gap-2 border-r border-theme/10 pr-2 mr-2">
                  <button
                    type="button"
                    onClick={handleSaveDiagram}
                    disabled={nodes.length === 0}
                    className="px-3 py-2 text-sm font-medium text-theme hover:bg-[var(--bg-hover)] rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                    title={
                      isAuthenticated
                        ? "Save Design"
                        : "Sign in to Save Designs"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      />
                    </svg>
                    {currentDiagramId ? "Update" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadDiagrams}
                    className="px-3 py-2 text-sm font-medium text-theme hover:bg-[var(--bg-hover)] rounded-md transition-colors flex items-center gap-2"
                    title={
                      isAuthenticated
                        ? "My Designs"
                        : "Sign in to view saved designs"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    My Designs
                  </button>
                </div>
              )}

              {problem?.id !== "free" && (
                <button
                  type="button"
                  onClick={runAssessment}
                  disabled={isAssessing}
                  className="px-6 py-1 bg-[var(--brand)] text-white font-bold rounded-md hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Run assessment on current design"
                >
                  {isAssessing ? "Assessing..." : "Run Assessment"}
                </button>
              )}
              <ThemeSwitcher />
              {/* User Profile / Auth Button */}
              <div className="relative">
                {isAuthenticated ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-theme hover:bg-[var(--bg-hover)] rounded-md transition-colors"
                    >
                      {user?.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name || "User"}
                          className="w-8 h-8 rounded-full object-cover border-2 border-[var(--brand)]"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-bold">
                          {user?.name?.[0]?.toUpperCase() ||
                            user?.email?.[0]?.toUpperCase() ||
                            "U"}
                        </div>
                      )}
                      <span className="hidden sm:inline">
                        {user?.name || user?.email}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {showUserMenu && (
                      <div className="absolute top-full right-0 mt-1 bg-surface shadow-lg rounded-lg border border-theme/10 py-1 z-50 min-w-[180px]">
                        <div className="px-4 py-2 border-b border-theme/10">
                          <p className="text-sm font-medium text-theme">
                            {user?.name || "User"}
                          </p>
                          <p className="text-xs text-muted truncate">
                            {user?.email}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                            setCurrentDiagramId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 text-sm font-medium bg-[var(--brand)] text-white rounded-md hover:brightness-95 transition-all"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          <ComponentPalette
            components={COMPONENTS}
            onAdd={addNodeFromPalette}
          />
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
            onNodeDragStop={onNodeDragStop}
          />
          <InspectorPanel
            problem={problem}
            activeTab={activeRightTab}
            setActiveTab={setActiveRightTab}
            inspectedNodeId={inspectedNodeId}
            setInspectedNodeId={setInspectedNodeId}
            propertyElements={propertyElements}
            customPropertyElements={customPropertyElements}
            onAddCustomProperty={handleAddCustomProperty}
            handleSave={handleSave}
            assessmentResult={assessment}
            onDetachFromGroup={handleDetachFromGroup}
            isNodeInGroup={
              inspectedNodeId
                ? nodes.find((n) => n.id === inspectedNodeId)?.parentId !==
                  undefined
                : false
            }
          />
        </div>

        {/* Clear Canvas Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-theme/10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-theme">
                    Clear Canvas?
                  </h3>
                  <p className="text-sm text-muted">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <p className="text-muted mb-6">
                Are you sure you want to clear all components and connections
                from the canvas? You will lose all your current work.
              </p>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={cancelClearCanvas}
                  className="flex-1 px-4 py-2 bg-theme/5 hover:bg-theme/10 text-theme font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmClearCanvas}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={async (email, password) => {
            await login({ email, password });
          }}
          onSignup={async (email, password, name) => {
            await signup({ email, password, name });
          }}
          onGoogleLogin={googleLogin}
        />

        {/* Diagram List Modal */}
        <DiagramListModal
          isOpen={showDiagramList}
          onClose={() => setShowDiagramList(false)}
          diagrams={savedDiagrams}
          onLoad={handleLoadDiagram}
          onDelete={handleDeleteDiagram}
          isLoading={loadingDiagrams}
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

        {/* Input Dialog */}
        {inputDialogConfig && (
          <InputDialog
            isOpen={showInputDialog}
            onClose={() => setShowInputDialog(false)}
            title={inputDialogConfig.title}
            label={inputDialogConfig.label}
            placeholder={inputDialogConfig.placeholder}
            defaultValue={inputDialogConfig.defaultValue}
            type={inputDialogConfig.type}
            required={inputDialogConfig.required}
            onConfirm={inputDialogConfig.onConfirm}
          />
        )}
      </div>
    </>
  );
};

// Wrap with ReactFlowProvider to enable useReactFlow hook
const SystemDesignPlaygroundWithProvider = () => (
  <ReactFlowProvider>
    <SystemDesignPlayground />
  </ReactFlowProvider>
);

export default SystemDesignPlaygroundWithProvider;
