import { useRef, useEffect, useCallback } from "react";
import type { Edge, Node } from "@xyflow/react";

export interface CanvasEvent {
  ts: number;
  action: "add_node" | "delete_node" | "add_edge";
  type?: string;
  source_type?: string;
  target_type?: string;
  graph_node_count: number;
  graph_edge_count: number;
}

interface CanvasEventBatch {
  user_id: string;
  problem_id: string;
  session_id: string;
  events: CanvasEvent[];
}

interface UseCanvasEventLoggerOptions {
  userId: string | undefined;
  problemId: string | undefined;
  isEnabled: boolean;
}

const API_BASE_URL = import.meta.env.VITE_ASSESSMENT_API_URL || "";

function resolveNodeType(node: Node): string {
  return (node.data?.componentId as string) || node.type || "unknown";
}

/**
 * Buffers canvas structural events (add/delete node, add edge) and flushes
 * them to the backend in batches every 15 seconds (or on component unmount).
 *
 * The backend writes each batch as JSONL to S3 for GNN training data.
 * All network calls are fire-and-forget — failures are silently ignored.
 */
export function useCanvasEventLogger({
  userId,
  problemId,
  isEnabled,
}: UseCanvasEventLoggerOptions) {
  const bufferRef = useRef<CanvasEvent[]>([]);
  // Stable session ID for the lifetime of this playground mount
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const flush = useCallback(() => {
    if (!isEnabled || !userId || !problemId || bufferRef.current.length === 0) {
      return;
    }

    const events = bufferRef.current.splice(0); // drain atomically
    const payload: CanvasEventBatch = {
      user_id: userId,
      problem_id: problemId,
      session_id: sessionIdRef.current,
      events,
    };

    // Fire-and-forget — training data is best-effort, never blocks UX
    fetch(`${API_BASE_URL}/api/v1/events/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // silently swallow — this is background telemetry, not user-facing
    });
  }, [isEnabled, userId, problemId]);

  // Flush every 15 s; also flush on unmount to capture final events
  useEffect(() => {
    if (!isEnabled) return;
    const interval = setInterval(flush, 15_000);
    return () => {
      clearInterval(interval);
      flush();
    };
  }, [isEnabled, flush]);

  const logNodeAdded = useCallback(
    (nodesRef: React.RefObject<Node[]>, edgesRef: React.RefObject<Edge[]>, node: Node) => {
      if (!isEnabled) return;
      bufferRef.current.push({
        ts: Date.now(),
        action: "add_node",
        type: resolveNodeType(node),
        graph_node_count: nodesRef.current?.length ?? 0,
        graph_edge_count: edgesRef.current?.length ?? 0,
      });
    },
    [isEnabled],
  );

  const logNodeDeleted = useCallback(
    (nodesRef: React.RefObject<Node[]>, edgesRef: React.RefObject<Edge[]>, node: Node) => {
      if (!isEnabled) return;
      bufferRef.current.push({
        ts: Date.now(),
        action: "delete_node",
        type: resolveNodeType(node),
        graph_node_count: nodesRef.current?.length ?? 0,
        graph_edge_count: edgesRef.current?.length ?? 0,
      });
    },
    [isEnabled],
  );

  const logEdgeAdded = useCallback(
    (
      nodesRef: React.RefObject<Node[]>,
      edgesRef: React.RefObject<Edge[]>,
      sourceId: string,
      targetId: string,
    ) => {
      if (!isEnabled) return;
      const currentNodes = nodesRef.current ?? [];
      const sourceNode = currentNodes.find((n) => n.id === sourceId);
      const targetNode = currentNodes.find((n) => n.id === targetId);
      bufferRef.current.push({
        ts: Date.now(),
        action: "add_edge",
        source_type: sourceNode ? resolveNodeType(sourceNode) : "unknown",
        target_type: targetNode ? resolveNodeType(targetNode) : "unknown",
        graph_node_count: currentNodes.length,
        graph_edge_count: edgesRef.current?.length ?? 0,
      });
    },
    [isEnabled],
  );

  return { logNodeAdded, logNodeDeleted, logEdgeAdded };
}
