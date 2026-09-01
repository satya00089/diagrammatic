import type { Edge, FitViewOptions, Node } from "@xyflow/react";

export type CanvasLayoutDirection = "TB" | "LR";

export type AdaptiveFitViewOptions = Pick<
  FitViewOptions,
  "padding" | "minZoom"
>;

const BASE_HORIZONTAL_PADDING = 32;
const BASE_VERTICAL_PADDING = 28;
const MAX_HORIZONTAL_PADDING = 64;
const MAX_VERTICAL_PADDING = 52;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const getGraphComplexity = (nodeCount: number, edgeCount: number): number => {
  const nodeFactor = clamp((nodeCount - 8) / 32, 0, 1);
  const edgeFactor = clamp((edgeCount - 12) / 80, 0, 1);
  const densityFactor = clamp(
    (edgeCount / Math.max(nodeCount, 1) - 1) / 3,
    0,
    1,
  );

  return clamp(nodeFactor * 0.6 + edgeFactor * 0.3 + densityFactor * 0.1, 0, 1);
};

const getMinimumZoom = (nodeCount: number, edgeCount: number): number => {
  if (nodeCount > 50 || edgeCount > 140) return 0.18;
  if (nodeCount > 24 || edgeCount > 60) return 0.25;
  if (nodeCount > 8 || edgeCount > 20) return 0.35;
  return 0.5;
};

/**
 * Choose a bounded viewport gutter for the current graph. React Flow still
 * calculates the final viewport from the actual measured node bounds; this
 * helper only adjusts the breathing room and minimum zoom for graph density.
 */
export const getAdaptiveFitViewOptions = (
  nodes: Node[],
  edges: Edge[],
  direction: CanvasLayoutDirection = "TB",
): AdaptiveFitViewOptions => {
  const visibleNodes = nodes.filter((node) => !node.hidden);
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = edges.filter(
    (edge) =>
      !edge.hidden &&
      visibleNodeIds.has(edge.source) &&
      visibleNodeIds.has(edge.target),
  );
  const complexity = getGraphComplexity(
    visibleNodes.length,
    visibleEdges.length,
  );
  const horizontalPadding = Math.round(
    clamp(
      BASE_HORIZONTAL_PADDING + complexity * 32 + (direction === "LR" ? 4 : 0),
      BASE_HORIZONTAL_PADDING,
      MAX_HORIZONTAL_PADDING,
    ),
  );
  const verticalPadding = Math.round(
    clamp(
      BASE_VERTICAL_PADDING + complexity * 24 + (direction === "TB" ? 4 : 0),
      BASE_VERTICAL_PADDING,
      MAX_VERTICAL_PADDING,
    ),
  );

  return {
    padding: {
      x: `${horizontalPadding}px`,
      y: `${verticalPadding}px`,
    },
    minZoom: getMinimumZoom(visibleNodes.length, visibleEdges.length),
  };
};
