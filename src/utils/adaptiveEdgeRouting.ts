import { Position } from "@xyflow/react";

export const ADAPTIVE_EDGE_HYSTERESIS = 40;

export type AdaptiveHorizontalSide = "left" | "right";

type XYPosition = {
  x: number;
  y: number;
};

/**
 * The edge renderer reads these values from React Flow's internal nodes. The
 * smaller shape keeps the routing helper independent from React Flow's
 * internal-node implementation and makes it straightforward to extend later.
 */
export type AdaptiveEdgeNode = {
  position?: XYPosition;
  width?: number;
  initialWidth?: number;
  measured?: {
    width?: number;
  };
  internals?: {
    positionAbsolute?: XYPosition;
  };
};

export type AdaptiveConnectionSides = {
  sourceSide: AdaptiveHorizontalSide;
  targetSide: AdaptiveHorizontalSide;
};

export type AdaptiveEdgeGeometry = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  sourceSide?: AdaptiveHorizontalSide;
  targetSide?: AdaptiveHorizontalSide;
  adapted: boolean;
};

type AdaptiveEdgeGeometryInput = Omit<
  AdaptiveEdgeGeometry,
  "sourceSide" | "targetSide" | "adapted"
> & {
  sourceNode?: AdaptiveEdgeNode;
  targetNode?: AdaptiveEdgeNode;
  sourceHandleId?: string | null;
  targetHandleId?: string | null;
  previousSourceSide?: AdaptiveHorizontalSide;
  hysteresis?: number;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const getNodeX = (node: AdaptiveEdgeNode | undefined): number | undefined => {
  const absoluteX = node?.internals?.positionAbsolute?.x;
  if (isFiniteNumber(absoluteX)) return absoluteX;

  const positionX = node?.position?.x;
  return isFiniteNumber(positionX) ? positionX : undefined;
};

const getNodeWidth = (
  node: AdaptiveEdgeNode | undefined,
): number | undefined => {
  const width = [node?.measured?.width, node?.width, node?.initialWidth].find(
    (candidate) => isFiniteNumber(candidate) && candidate > 0,
  );
  return isFiniteNumber(width) ? width : undefined;
};

export const getNodeCenterX = (
  node: AdaptiveEdgeNode | undefined,
): number | undefined => {
  const nodeX = getNodeX(node);
  const nodeWidth = getNodeWidth(node);
  return nodeX !== undefined && nodeWidth !== undefined
    ? nodeX + nodeWidth / 2
    : undefined;
};

const getNodeSideX = (
  node: AdaptiveEdgeNode | undefined,
  side: AdaptiveHorizontalSide,
): number | undefined => {
  const nodeX = getNodeX(node);
  const nodeWidth = getNodeWidth(node);
  if (nodeX === undefined || nodeWidth === undefined) return undefined;
  return side === "left" ? nodeX : nodeX + nodeWidth;
};

const getPositionForSide = (side: AdaptiveHorizontalSide): Position =>
  side === "left" ? Position.Left : Position.Right;

/** Resolve a persisted React Flow handle id to the side it represents. */
export const getHorizontalHandleSide = (
  handleId: string | null | undefined,
  position: Position | null | undefined,
): AdaptiveHorizontalSide | undefined => {
  if (handleId === "left" || handleId?.endsWith(":left")) return "left";
  if (handleId === "right" || handleId?.endsWith(":right")) return "right";
  if (position === "left") return "left";
  if (position === "right") return "right";
  return undefined;
};

/**
 * Select a horizontal direction with hysteresis. The source side is the
 * remembered state; the target side is always its opposite so the semantic
 * source/target direction remains intact.
 */
export const getAdaptiveConnectionSides = ({
  sourceCenterX,
  targetCenterX,
  previousSourceSide,
  hysteresis = ADAPTIVE_EDGE_HYSTERESIS,
}: {
  sourceCenterX: number;
  targetCenterX: number;
  previousSourceSide?: AdaptiveHorizontalSide;
  hysteresis?: number;
}): AdaptiveConnectionSides => {
  const threshold = isFiniteNumber(hysteresis)
    ? Math.max(0, hysteresis)
    : ADAPTIVE_EDGE_HYSTERESIS;
  const initialSide: AdaptiveHorizontalSide =
    previousSourceSide ?? (targetCenterX >= sourceCenterX ? "right" : "left");

  let sourceSide = initialSide;
  if (initialSide === "right" && targetCenterX < sourceCenterX - threshold) {
    sourceSide = "left";
  } else if (
    initialSide === "left" &&
    targetCenterX > sourceCenterX + threshold
  ) {
    sourceSide = "right";
  }

  return {
    sourceSide,
    targetSide: sourceSide === "right" ? "left" : "right",
  };
};

/**
 * Derive render-only ERD geometry. The edge's persisted handles and metadata
 * are intentionally not returned or modified here.
 */
export const getAdaptiveEdgeGeometry = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceNode,
  targetNode,
  sourceHandleId,
  targetHandleId,
  previousSourceSide,
  hysteresis,
}: AdaptiveEdgeGeometryInput): AdaptiveEdgeGeometry => {
  const currentSourceSide = getHorizontalHandleSide(
    sourceHandleId,
    sourcePosition,
  );
  const currentTargetSide = getHorizontalHandleSide(
    targetHandleId,
    targetPosition,
  );
  const baseGeometry = {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  };

  // Version one intentionally adapts only horizontal-to-horizontal edges.
  // Existing vertical connections remain owned by their original handles.
  if (!currentSourceSide || !currentTargetSide) {
    return {
      ...baseGeometry,
      adapted: false,
    };
  }

  const sourceCenterX = getNodeCenterX(sourceNode);
  const targetCenterX = getNodeCenterX(targetNode);
  if (sourceCenterX === undefined || targetCenterX === undefined) {
    return {
      ...baseGeometry,
      sourceSide: currentSourceSide,
      targetSide: currentTargetSide,
      adapted: false,
    };
  }

  const { sourceSide, targetSide } = getAdaptiveConnectionSides({
    sourceCenterX,
    targetCenterX,
    previousSourceSide: previousSourceSide ?? currentSourceSide,
    hysteresis,
  });
  const nextSourceX = getNodeSideX(sourceNode, sourceSide);
  const nextTargetX = getNodeSideX(targetNode, targetSide);

  return {
    sourceX: nextSourceX ?? sourceX,
    sourceY,
    targetX: nextTargetX ?? targetX,
    targetY,
    sourcePosition: getPositionForSide(sourceSide),
    targetPosition: getPositionForSide(targetSide),
    sourceSide,
    targetSide,
    adapted:
      sourceSide !== currentSourceSide || targetSide !== currentTargetSide,
  };
};
