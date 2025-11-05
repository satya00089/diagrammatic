import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { 
  MdAccessTime, 
  MdUpload,
  MdUndo,
  MdRedo,
  MdClose,
  MdDownload,
  MdFolder,
  MdExpandMore
} from "react-icons/md";
import { FcFlowChart } from "react-icons/fc";
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
import {
  exportAsJSON,
  exportAsXML,
  importFromJSON,
  importFromXML,
  downloadFile,
  readFileAsText,
} from "../utils/exportImport";

interface SystemDesignPlaygroundProps {
  problem?: SystemDesignProblem | null;
  onBack?: () => void;
}

// Define edgeTypes outside component to prevent re-creation on every render
const edgeTypes = { customEdge: CustomEdge };

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
  }
);

// Factory function to create node component with copy handler and group detection
const createNodeWithCopyHandler = (
  onCopy: (id: string, data: NodeData) => void,
  nodes: Node[]
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

  // Get diagramId from query parameters
  const searchParams = new URLSearchParams(
    globalThis.location.hash.split("?")[1]
  );
  const diagramIdFromUrl = searchParams.get("diagramId");

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

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  // Timer state - always running for problems
  const [elapsedTime, setElapsedTime] = useState<number>(0); // in seconds
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        `custom-problem-${idFromUrl}`
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
            `Failed to fetch problem: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        setProblem(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching the problem"
        );
        console.error("Error fetching problem:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [idFromUrl]);

  const onBack = () => navigate("/");

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

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load diagram from URL parameter if diagramId is present, or load saved progress for problems
  useEffect(() => {
    if (diagramIdFromUrl && isAuthenticated) {
      // Load specific diagram from URL
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
          toast.error(
            "Failed to load diagram. It may have been deleted or you don't have access to it."
          );
        }
      };

      loadDiagramFromUrl();
    } else if (idFromUrl === "free" && isAuthenticated) {
      // For Design Studio: restore the last auto-saved diagram
      const lastDiagramKey = `last-diagram-${user?.id || 'anonymous'}`;
      const lastDiagramId = localStorage.getItem(lastDiagramKey);

      if (lastDiagramId) {
        // Try to load the last auto-saved diagram
        const loadLastDiagram = async () => {
          try {
            const diagram = await apiService.getDiagram(lastDiagramId);
            const loadedNodes = diagram.nodes as Node[];
            const loadedEdges = diagram.edges as Edge[];

            setNodes(loadedNodes);
            setEdges(loadedEdges);
            setCurrentDiagramId(diagram.id);

            // Immediately update canvas state to prevent undo/redo from clearing the loaded data
            setCanvasState({ nodes: loadedNodes, edges: loadedEdges });

            toast.success("Design restored from previous session");
          } catch (err) {
            console.error("Failed to load last diagram:", err);
            // If loading fails, remove the invalid diagram ID from localStorage
            localStorage.removeItem(lastDiagramKey);
            toast.error("Failed to restore previous design. Starting fresh.");
          }
        };

        loadLastDiagram();
      }
    } else if (idFromUrl && idFromUrl !== "free" && isAuthenticated) {
      // Load saved progress for problem-solving
      const progressKey = `problem-progress-${user?.id || 'anonymous'}-${idFromUrl}`;
      const savedProgress = localStorage.getItem(progressKey);

      if (savedProgress) {
        try {
          const progressData = JSON.parse(savedProgress);
          const loadedNodes = progressData.nodes as Node[];
          const loadedEdges = progressData.edges as Edge[];

          setNodes(loadedNodes);
          setEdges(loadedEdges);

          // Restore timer progress if available
          if (progressData.elapsedTime) {
            setElapsedTime(progressData.elapsedTime);
          }

          // Immediately update canvas state
          setCanvasState({ nodes: loadedNodes, edges: loadedEdges });

          toast.success("Progress restored from previous session");
        } catch (error) {
          console.error("Failed to load saved progress:", error);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagramIdFromUrl, isAuthenticated, idFromUrl, user?.id]);

  // Enable auto-save for authenticated users in both free mode and problem-solving mode
  useEffect(() => {
    setAutoSaveEnabled(isAuthenticated && idFromUrl !== undefined);
  }, [isAuthenticated, idFromUrl]);

  // Auto-save effect - save canvas state when diagram content changes
  useEffect(() => {
    if (!autoSaveEnabled || nodes.length === 0) return;

    const autoSave = async () => {
      try {
        setAutoSaveStatus('saving');

        if (idFromUrl === "free") {
          // For Design Studio: save to API as diagrams
          const title = currentDiagramId
            ? "Auto-saved Design"
            : `Auto-saved Design - ${new Date().toLocaleString()}`;

          if (currentDiagramId) {
            // Update existing diagram
            await apiService.updateDiagram(currentDiagramId, {
              title,
              description: "Auto-saved design",
              nodes,
              edges,
            });

            // Ensure the diagram ID is stored for restoration on refresh
            const lastDiagramKey = `last-diagram-${user?.id || 'anonymous'}`;
            localStorage.setItem(lastDiagramKey, currentDiagramId);
          } else {
            // Create new auto-saved diagram
            const saved = await apiService.saveDiagram({
              title,
              description: "Auto-saved design",
              nodes,
              edges,
            });
            setCurrentDiagramId(saved.id);

            // Store the diagram ID for restoration on refresh
            const lastDiagramKey = `last-diagram-${user?.id || 'anonymous'}`;
            localStorage.setItem(lastDiagramKey, saved.id);
          }
        } else {
          // For Problem-solving: save progress to localStorage
          const progressKey = `problem-progress-${user?.id || 'anonymous'}-${idFromUrl}`;
          const progressData = {
            problemId: idFromUrl,
            nodes,
            edges,
            lastSaved: new Date().toISOString(),
            elapsedTime, // Also save timer progress
          };
          localStorage.setItem(progressKey, JSON.stringify(progressData));
        }

        setAutoSaveStatus('saved');
        setLastSavedAt(new Date());

        // Show toast notification for successful auto-save
        toast.success(
          idFromUrl === "free"
            ? "Design auto-saved successfully!"
            : "Progress auto-saved successfully!"
        );

        // Reset status after 3 seconds
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setAutoSaveStatus('error');

        // Reset status after 5 seconds
        setTimeout(() => setAutoSaveStatus('idle'), 5000);
      }
    };

    // Debounce auto-save to avoid too many requests
    const timeoutId = setTimeout(autoSave, 3000); // Save after 3 seconds of inactivity

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, autoSaveEnabled, idFromUrl, currentDiagramId, user?.id]);

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

  // Timer effect - runs continuously every second (only for problems, not free mode)
  useEffect(() => {
    if (idFromUrl === "free") return; // Don't run timer for Design Studio

    timerIntervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [idFromUrl]);

  // Format elapsed time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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
        const allProperties =
          dataObj && typeof dataObj === "object"
            ? ({ ...dataObj } as Record<string, unknown>)
            : ({} as Record<string, unknown>);

        // Remove system properties from the properties object
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { icon, subtitle, ...customProperties } = allProperties;

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
        const edgeLabel = typeof maybeLabel === "string" ? maybeLabel : undefined;

        return {
          id: e.id ?? `${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          type: inferredType,
          label: edgeLabel,
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
        })
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
      })
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
    "details"
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

  function updateEdgeLabel(
    eds: Edge[],
    id: string,
    label: string,
    hasLabel: boolean
  ) {
    return eds.map((edge) =>
      edge.id === id
        ? { ...edge, data: { ...edge.data, label, hasLabel }, label }
        : edge
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
      listener as EventListener
    );
    return () =>
      globalThis.removeEventListener(
        "diagram:edge-label-change",
        listener as EventListener
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
        })
      );
    };

    globalThis.addEventListener(
      "diagram:node-delete",
      deleteListener as EventListener
    );
    globalThis.addEventListener(
      "diagram:node-toggle",
      toggleListener as EventListener
    );
    globalThis.addEventListener(
      "diagram:node-detach",
      detachListener as EventListener
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
      globalThis.removeEventListener(
        "diagram:node-detach",
        detachListener as EventListener
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
    value: string | number | boolean
  ) => {
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
            : n
        )
      );

      return updated;
    });
  };

  const handleUpdateCustomProperty = (
    id: string,
    updates: Partial<CustomProperty>
  ) => {
    if (!inspectedNodeId) return;

    setCustomProperties((prev) => {
      const nodeCustomProps = prev[inspectedNodeId] || [];
      const updated = nodeCustomProps.map((prop) =>
        prop.id === id ? { ...prop, ...updates } : prop
      );

      // Save to node data
      setNodes((nds) =>
        nds.map((n) =>
          n.id === inspectedNodeId
            ? { ...n, data: { ...n.data, _customProperties: updated } }
            : n
        )
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
            : n
        )
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

  // Handle copying a node (defined before early returns to satisfy React Hook rules)
  const handleNodeCopy = useCallback(
    (id: string, data: NodeData) => {
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
    },
    [nodes, setNodes]
  );

  // Register node types (memoized to prevent unnecessary re-renders)
  const nodeTypes = useMemo(
    () => ({
      custom: createNodeWithCopyHandler(handleNodeCopy, nodes),
      group: GroupNode,
    }),
    [handleNodeCopy, nodes]
  );

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
      ".react-flow__viewport"
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
          `system-design-${Date.now()}.${fileExtension}`
        );
        a.setAttribute("href", dataUrl);
        a.click();
      })
      .catch((error) => {
        console.error("Error generating image:", error);
      });
  };

  // Export diagram as JSON
  const handleExportJSON = () => {
    try {
      const title = problem?.title || "System Design";
      const description = problem?.description;
      const jsonContent = exportAsJSON(nodes, edges, title, description);
      const filename = `${title.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.json`;
      downloadFile(jsonContent, filename, "application/json");
      toast.success("Design exported as JSON successfully!");
    } catch (error) {
      console.error("Export JSON error:", error);
      toast.error("Failed to export as JSON");
    }
  };

  // Export diagram as XML
  const handleExportXML = () => {
    try {
      const title = problem?.title || "System Design";
      const description = problem?.description;
      const xmlContent = exportAsXML(nodes, edges, title, description);
      const filename = `${title.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.drawio`;
      downloadFile(xmlContent, filename, "application/xml");
      toast.success("Design exported as XML successfully!");
    } catch (error) {
      console.error("Export XML error:", error);
      toast.error("Failed to export as XML");
    }
  };

  // Import diagram from file
  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileAsText(file);
      let importedData: { nodes: Node[]; edges: Edge[] };

      // Determine file type and parse accordingly
      if (file.name.endsWith(".json")) {
        importedData = importFromJSON(content);
        toast.success("Design imported from JSON successfully!");
      } else if (file.name.endsWith(".xml") || file.name.endsWith(".drawio")) {
        importedData = importFromXML(content);
        toast.success("Design imported from XML successfully!");
      } else {
        // Try to detect format from content
        const trimmed = content.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          importedData = importFromJSON(content);
          toast.success("Design imported from JSON successfully!");
        } else if (
          trimmed.startsWith("<?xml") ||
          trimmed.startsWith("<mxfile")
        ) {
          importedData = importFromXML(content);
          toast.success("Design imported from XML successfully!");
        } else {
          throw new Error(
            "Unsupported file format. Please use JSON or XML/DrawIO files."
          );
        }
      }

      // Apply imported data
      setNodes(importedData.nodes);
      setEdges(importedData.edges);

      // Clear current diagram ID since this is now a new/imported diagram
      setCurrentDiagramId(null);

      // Fit view to show all imported nodes
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 });
      }, 100);
    } catch (error) {
      console.error("Import error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to import diagram"
      );
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Trigger file input click
  const handleImportClick = () => {
    fileInputRef.current?.click();
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

    // Store the diagram ID for restoration on refresh
    if (isAuthenticated && user?.id) {
      const lastDiagramKey = `last-diagram-${user.id}`;
      localStorage.setItem(lastDiagramKey, diagram.id);
    }
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
      (node) => node.type !== "group" && !node.parentId
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
        groupNodes.some((g) => g.id === edge.target)
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
        regularNodes.some((n) => n.id === edge.target)
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
        <header className="bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] shadow-lg overflow-visible">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
            <div className="flex items-center justify-between h-12 overflow-visible">
              {/* Left side - Logo and Title */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex items-center space-x-3 group cursor-pointer"
                >
                  <img
                    src="./logo.png"
                    alt="Logo"
                    className="h-8 transition-transform group-hover:scale-110 duration-300"
                  />
                  <span className="text-lg font-bold text-white">
                    Diagrammatic
                  </span>
                </button>
                <div className="hidden md:flex items-center space-x-3 border-l border-white/20 pl-4">
                  <h1 
                    className="text-sm font-semibold text-white max-w-[200px] truncate cursor-default"
                    data-tooltip={problem.title}
                  >
                    {problem.title}
                  </h1>

                  {/* Show difficulty and estimated time only for problems, not Design Studio */}
                  {idFromUrl !== "free" && (
                    <>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          problem.difficulty === "Easy"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : problem.difficulty === "Medium"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                        }`}
                      >
                        {problem.difficulty}
                      </span>
                      {problem.estimated_time && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 flex items-center gap-1">
                          <MdAccessTime className="h-3 w-3" />
                          {problem.estimated_time}
                        </span>
                      )}
                    </>
                  )}

                  {/* Timer - only show for problems, not Design Studio */}
                  {idFromUrl !== "free" && (
                    <div className="flex items-center gap-1 border-l border-white/20 pl-3">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 flex items-center gap-1 font-mono">
                        {formatTime(elapsedTime)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Undo/Redo buttons */}
                <div className="hidden sm:flex items-center gap-1 border-r border-white/20 pr-2 mr-2">
                  <button
                    type="button"
                    onClick={undo}
                    disabled={!canUndo}
                    className="p-2 text-white hover:bg-white/20 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    data-tooltip="Undo (Ctrl+Z)"
                  >
                    <MdUndo className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={redo}
                    disabled={!canRedo}
                    className="p-2 text-white hover:bg-white/20 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    data-tooltip="Redo (Ctrl+Y or Ctrl+Shift+Z)"
                  >
                    <MdRedo className="h-5 w-5" />
                  </button>
                </div>

                {/* Clear Canvas button */}
                <button
                  type="button"
                  onClick={handleClearCanvas}
                  disabled={nodes.length === 0 && edges.length === 0}
                  className="p-2 text-white hover:bg-white/20 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  data-tooltip="Clear Canvas"
                >
                  <MdClose className="h-5 w-5" />
                </button>

                {/* Import button - only show for Design Studio (free mode) */}
                {idFromUrl === "free" && (
                  <>
                    <button
                      type="button"
                      onClick={handleImportClick}
                      className="p-2 text-white hover:bg-white/20 rounded-md transition-colors cursor-pointer"
                      data-tooltip="Import Design"
                    >
                      <MdUpload className="h-5 w-5" />
                    </button>

                    {/* Hidden file input for import */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.xml,.drawio"
                      onChange={handleImportFile}
                      className="hidden"
                      aria-label="Import diagram file"
                    />
                  </>
                )}

                {/* Download/Export button with dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    disabled={nodes.length === 0}
                    className="p-2 text-white hover:bg-white/20 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    data-tooltip="Export Design"
                  >
                    <MdDownload className="h-5 w-5" />
                  </button>

                  {/* Export format dropdown */}
                  {showDownloadMenu && (
                    <div className="absolute top-full right-0 mt-1 bg-[var(--surface)] shadow-lg rounded-lg border border-theme/10 py-1 z-50 min-w-[180px]">
                      <div className="px-3 py-1 text-xs font-semibold text-muted uppercase tracking-wider">
                        Images
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          downloadImage("png");
                          setShowDownloadMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-theme hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                      >
                        PNG Image
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          downloadImage("jpeg");
                          setShowDownloadMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-theme hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                      >
                        JPEG Image
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          downloadImage("svg");
                          setShowDownloadMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-theme hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                      >
                        SVG Vector
                      </button>

                      <div className="border-t border-theme/10 my-1"></div>

                      <div className="px-3 py-1 text-xs font-semibold text-muted uppercase tracking-wider">
                        Data Files
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleExportJSON();
                          setShowDownloadMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-theme hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                      >
                        JSON Format
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleExportXML();
                          setShowDownloadMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-theme hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                      >
                        XML/DrawIO
                      </button>
                    </div>
                  )}
                </div>

                {/* Layout button with dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                    disabled={nodes.length === 0}
                    className="p-2 text-white hover:bg-white/20 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    data-tooltip="Auto Layout"
                  >
                    <FcFlowChart className="h-5 w-5" />
                  </button>

                  {/* Layout direction dropdown */}
                  {showLayoutMenu && (
                    <div className="absolute top-full right-0 mt-1 bg-[var(--surface)] shadow-lg rounded-lg border border-theme/10 py-1 z-50 min-w-[160px]">
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

                {/* Design Management Buttons (only for free mode and authenticated users) */}
                {idFromUrl === "free" && (
                  <div className="hidden sm:flex items-center gap-2 border-r border-white/20 pr-2 mr-2">
                    {/* Auto-save indicator */}
                    {autoSaveEnabled && (
                      <div className="flex items-center gap-2 px-2 py-1 text-xs text-white/80">
                        {autoSaveStatus === 'saving' && (
                          <>
                            <div className="w-3 h-3 border border-white/60 border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving...</span>
                          </>
                        )}
                        {autoSaveStatus === 'saved' && (
                          <>
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <span>Saved {lastSavedAt && `at ${lastSavedAt.toLocaleTimeString()}`}</span>
                          </>
                        )}
                        {autoSaveStatus === 'error' && (
                          <>
                            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                            <span>Save failed</span>
                          </>
                        )}
                        {autoSaveStatus === 'idle' && lastSavedAt && (
                          <>
                            <div className="w-3 h-3 bg-white/40 rounded-full"></div>
                            <span>Saved {lastSavedAt.toLocaleTimeString()}</span>
                          </>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleLoadDiagrams}
                      className="px-3 py-2 text-sm font-medium text-white hover:bg-white/20 rounded-md transition-colors flex items-center gap-2"
                      data-tooltip={
                        isAuthenticated
                          ? "My Designs"
                          : "Sign in to view saved designs"
                      }
                    >
                      <MdFolder className="h-4 w-4" />
                      My Designs
                    </button>
                  </div>
                )}

                {/* Auto-save indicator for problem-solving mode */}
                {idFromUrl && idFromUrl !== "free" && autoSaveEnabled && (
                  <div className="hidden sm:flex items-center gap-2 border-r border-white/20 pr-2 mr-2">
                    <div className="flex items-center gap-2 px-2 py-1 text-xs text-white/80">
                      {autoSaveStatus === 'saving' && (
                        <>
                          <div className="w-3 h-3 border border-white/60 border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving progress...</span>
                        </>
                      )}
                      {autoSaveStatus === 'saved' && (
                        <>
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <span>Progress saved {lastSavedAt && `at ${lastSavedAt.toLocaleTimeString()}`}</span>
                        </>
                      )}
                      {autoSaveStatus === 'error' && (
                        <>
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <span>Save failed</span>
                        </>
                      )}
                      {autoSaveStatus === 'idle' && lastSavedAt && (
                        <>
                          <div className="w-3 h-3 bg-white/40 rounded-full"></div>
                          <span>Progress saved {lastSavedAt.toLocaleTimeString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {problem?.id !== "free" && (
                  <button
                    type="button"
                    onClick={runAssessment}
                    disabled={isAssessing}
                    className="px-6 py-1 text-white font-bold rounded-md hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    data-tooltip="Run assessment on current design"
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
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 rounded-md transition-colors"
                      >
                        {user?.picture ? (
                          <img
                            src={user.picture}
                            alt={user.name || "User"}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold">
                            {user?.name?.[0]?.toUpperCase() ||
                              user?.email?.[0]?.toUpperCase() ||
                              "U"}
                          </div>
                        )}
                        <span className="hidden sm:inline">
                          {user?.name || user?.email}
                        </span>
                        <MdExpandMore className="h-4 w-4" />
                      </button>

                      {showUserMenu && (
                        <div className="absolute top-full right-0 mt-1 bg-[var(--surface)] shadow-lg rounded-lg border border-theme/10 py-1 z-50 min-w-[180px]">
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
                      className="px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-white/20 transition-colors"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

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

        {/* Design List Modal */}
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
