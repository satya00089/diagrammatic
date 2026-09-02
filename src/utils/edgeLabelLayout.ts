export type EdgePoint = { x: number; y: number };

export type EdgeLabelNode = {
  id: string;
  position: EdgePoint;
  width?: number | null;
  height?: number | null;
  measured?: {
    width?: number;
    height?: number;
  };
  internals?: {
    positionAbsolute?: EdgePoint;
  };
};

export type EdgeLabelLayout = {
  center: EdgePoint;
  width: number;
  height: number;
  lineCount: number;
};

type EdgePathSegment = {
  start: EdgePoint;
  end: EdgePoint;
  deltaX: number;
  deltaY: number;
  length: number;
};

type EdgeLabelLayoutOptions = {
  label: string;
  edgePath: string;
  centerX: number;
  centerY: number;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  labelShift: number;
  textWidth: number;
  nodes?: EdgeLabelNode[];
  labelMaxWidth?: number;
};

const LABEL_PADDING_X = 16;
const LABEL_PADDING_Y = 4;
const LABEL_MIN_WIDTH = 100;
const LABEL_MAX_WIDTH = 240;
const PATH_CLEARANCE = 24;
const NODE_CLEARANCE = 8;
const LABEL_LINE_HEIGHT = 14;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Extract the points that are useful for stepped and straight edge paths.
 * Bezier control points are intentionally ignored; the direct source/target
 * fallback below still gives those edges a stable label size and anchor.
 */
export const getPathPoints = (edgePath: string): EdgePoint[] => {
  const points: EdgePoint[] = [];
  const commandPattern =
    /([MLQ])\s*(-?\d*\.?\d+)\s*,?\s*(-?\d*\.?\d+)(?:\s+(-?\d*\.?\d+)\s*,?\s*(-?\d*\.?\d+))?/g;
  let match: RegExpExecArray | null;

  while ((match = commandPattern.exec(edgePath)) !== null) {
    const isQuadratic = match[1] === "Q";
    const x = Number(isQuadratic ? match[4] : match[2]);
    const y = Number(isQuadratic ? match[5] : match[3]);

    if (Number.isFinite(x) && Number.isFinite(y)) {
      points.push({ x, y });
    }
  }

  return points;
};

const getPathSegments = (
  edgePath: string,
  source: EdgePoint,
  target: EdgePoint,
): EdgePathSegment[] => {
  const parsedPoints = getPathPoints(edgePath);
  const points = parsedPoints.length > 1 ? parsedPoints : [source, target];

  return points.slice(1).reduce<EdgePathSegment[]>((segments, point, index) => {
    const start = points[index];
    const deltaX = point.x - start.x;
    const deltaY = point.y - start.y;
    const length = Math.hypot(deltaX, deltaY);

    if (length === 0) return segments;

    const previous = segments[segments.length - 1];
    const crossProduct = previous
      ? previous.deltaX * deltaY - previous.deltaY * deltaX
      : 0;
    const dotProduct = previous
      ? previous.deltaX * deltaX + previous.deltaY * deltaY
      : 0;

    // React Flow can represent one straight corridor as several collinear
    // segments. Merge those pieces so the label gets the full usable run.
    if (previous && Math.abs(crossProduct) < 0.001 && dotProduct >= 0) {
      previous.end = point;
      previous.deltaX = point.x - previous.start.x;
      previous.deltaY = point.y - previous.start.y;
      previous.length = Math.hypot(previous.deltaX, previous.deltaY);
      return segments;
    }

    segments.push({ start, end: point, deltaX, deltaY, length });
    return segments;
  }, []);
};

const getSegmentMidpoint = (segment: EdgePathSegment): EdgePoint => ({
  x: (segment.start.x + segment.end.x) / 2,
  y: (segment.start.y + segment.end.y) / 2,
});

const getNearestSegment = (
  segments: EdgePathSegment[],
  point: EdgePoint,
): EdgePathSegment => {
  return segments.reduce(
    (nearest, segment) => {
      const lengthSquared = segment.length ** 2;
      const progress = clamp(
        ((point.x - segment.start.x) * segment.deltaX +
          (point.y - segment.start.y) * segment.deltaY) /
          lengthSquared,
        0,
        1,
      );
      const projectedPoint = {
        x: segment.start.x + segment.deltaX * progress,
        y: segment.start.y + segment.deltaY * progress,
      };
      const nearestDistance = Math.hypot(
        projectedPoint.x - point.x,
        projectedPoint.y - point.y,
      );

      if (!nearest) return { segment, distance: nearestDistance };
      return nearestDistance < nearest.distance
        ? { segment, distance: nearestDistance }
        : nearest;
    },
    null as { segment: EdgePathSegment; distance: number } | null,
  )!.segment;
};

const getShiftedLabelCenter = ({
  edgePath,
  centerX,
  centerY,
  sourceX,
  sourceY,
  targetX,
  targetY,
  labelShift,
}: {
  edgePath: string;
  centerX: number;
  centerY: number;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  labelShift: number;
}) => {
  if (labelShift === 0) return { x: centerX, y: centerY };

  const segments = getPathSegments(
    edgePath,
    { x: sourceX, y: sourceY },
    { x: targetX, y: targetY },
  );
  const totalPathLength = segments.reduce(
    (length, segment) => length + segment.length,
    0,
  );

  if (totalPathLength > 0) {
    let centerPathDistance = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    let pathDistance = 0;

    for (const segment of segments) {
      const lengthSquared = segment.length ** 2;
      const projectedProgress = clamp(
        ((centerX - segment.start.x) * segment.deltaX +
          (centerY - segment.start.y) * segment.deltaY) /
          lengthSquared,
        0,
        1,
      );
      const projectedX = segment.start.x + segment.deltaX * projectedProgress;
      const projectedY = segment.start.y + segment.deltaY * projectedProgress;
      const distanceToCenter = Math.hypot(
        projectedX - centerX,
        projectedY - centerY,
      );

      if (distanceToCenter < closestDistance) {
        closestDistance = distanceToCenter;
        centerPathDistance = pathDistance + segment.length * projectedProgress;
      }

      pathDistance += segment.length;
    }

    const targetPathDistance =
      labelShift > 0
        ? centerPathDistance +
          (totalPathLength - centerPathDistance) * Math.abs(labelShift)
        : centerPathDistance * (1 - Math.abs(labelShift));
    let remainingDistance = targetPathDistance;

    for (const segment of segments) {
      if (remainingDistance <= segment.length) {
        const progress = remainingDistance / segment.length;
        return {
          x: segment.start.x + segment.deltaX * progress,
          y: segment.start.y + segment.deltaY * progress,
        };
      }
      remainingDistance -= segment.length;
    }
  }

  const directDeltaX = targetX - sourceX;
  const directDeltaY = targetY - sourceY;
  const directLengthSquared = directDeltaX ** 2 + directDeltaY ** 2;
  if (directLengthSquared === 0) return { x: centerX, y: centerY };

  const centerProgress = clamp(
    ((centerX - sourceX) * directDeltaX + (centerY - sourceY) * directDeltaY) /
      directLengthSquared,
    0,
    1,
  );
  const endpointProgress = labelShift > 0 ? 1 : 0;
  const progress =
    centerProgress + (endpointProgress - centerProgress) * Math.abs(labelShift);

  return {
    x: sourceX + directDeltaX * progress,
    y: sourceY + directDeltaY * progress,
  };
};

const getNodeRect = (node: EdgeLabelNode) => {
  const position = node.internals?.positionAbsolute ?? node.position;
  const width = node.measured?.width ?? node.width ?? 0;
  const height = node.measured?.height ?? node.height ?? 0;

  if (width <= 0 || height <= 0) return null;

  return {
    left: position.x - NODE_CLEARANCE,
    right: position.x + width + NODE_CLEARANCE,
    top: position.y - NODE_CLEARANCE,
    bottom: position.y + height + NODE_CLEARANCE,
  };
};

const intersectsNode = (
  center: EdgePoint,
  width: number,
  height: number,
  nodes: EdgeLabelNode[],
) => {
  const left = center.x - width / 2;
  const right = center.x + width / 2;
  const top = center.y - height / 2;
  const bottom = center.y + height / 2;

  return nodes.some((node) => {
    const rect = getNodeRect(node);
    return (
      rect !== null &&
      left < rect.right &&
      right > rect.left &&
      top < rect.bottom &&
      bottom > rect.top
    );
  });
};

const getLabelDimensions = (
  textWidth: number,
  segmentLength: number,
  labelMaxWidth?: number,
) => {
  const maxWidth = clamp(
    labelMaxWidth ?? LABEL_MAX_WIDTH,
    LABEL_MIN_WIDTH,
    LABEL_MAX_WIDTH,
  );
  const segmentWidth = Math.max(
    LABEL_MIN_WIDTH,
    segmentLength - PATH_CLEARANCE,
  );
  const width = clamp(
    Math.max(LABEL_MIN_WIDTH, textWidth + LABEL_PADDING_X),
    LABEL_MIN_WIDTH,
    Math.min(maxWidth, segmentWidth),
  );
  const lineWidth = Math.max(24, width - LABEL_PADDING_X);
  const lineCount = Math.max(1, Math.ceil(textWidth / lineWidth));

  return {
    width,
    height: lineCount * LABEL_LINE_HEIGHT + LABEL_PADDING_Y,
    lineCount,
  };
};

const getCandidateCenters = (
  segment: EdgePathSegment,
  preferredCenter: EdgePoint,
) => {
  const midpoint = getSegmentMidpoint(segment);
  const normalLength = segment.length || 1;
  const normal = {
    x: -segment.deltaY / normalLength,
    y: segment.deltaX / normalLength,
  };

  return [
    preferredCenter,
    midpoint,
    { x: midpoint.x + normal.x * 16, y: midpoint.y + normal.y * 16 },
    { x: midpoint.x - normal.x * 16, y: midpoint.y - normal.y * 16 },
    { x: midpoint.x + normal.x * 28, y: midpoint.y + normal.y * 28 },
    { x: midpoint.x - normal.x * 28, y: midpoint.y - normal.y * 28 },
  ];
};

/**
 * Choose a label size and anchor from the actual path rather than a fixed
 * rectangle. Candidate anchors are moved off the path when a node occupies
 * the preferred label area.
 */
export const getEdgeLabelLayout = ({
  label,
  edgePath,
  centerX,
  centerY,
  sourceX,
  sourceY,
  targetX,
  targetY,
  labelShift,
  textWidth,
  nodes = [],
  labelMaxWidth,
}: EdgeLabelLayoutOptions): EdgeLabelLayout => {
  const safeTextWidth = Math.max(textWidth, label.length * 6);
  const source = { x: sourceX, y: sourceY };
  const target = { x: targetX, y: targetY };
  const segments = getPathSegments(edgePath, source, target);
  const fallbackSegment: EdgePathSegment = {
    start: source,
    end: target,
    deltaX: targetX - sourceX,
    deltaY: targetY - sourceY,
    length: Math.hypot(targetX - sourceX, targetY - sourceY),
  };
  const usableSegments = segments.length > 0 ? segments : [fallbackSegment];
  const preferredCenter = getShiftedLabelCenter({
    edgePath,
    centerX,
    centerY,
    sourceX,
    sourceY,
    targetX,
    targetY,
    labelShift,
  });
  const sortedSegments = [...usableSegments].sort(
    (first, second) => second.length - first.length,
  );
  const preferredSegment = getNearestSegment(usableSegments, preferredCenter);
  const candidateSegments = [
    preferredSegment,
    ...sortedSegments.filter((segment) => segment !== preferredSegment),
  ];
  const candidates = candidateSegments.flatMap((segment, index) => {
    const centers = getCandidateCenters(
      segment,
      index === 0 ? preferredCenter : getSegmentMidpoint(segment),
    );
    const dimensions = getLabelDimensions(
      safeTextWidth,
      segment.length,
      labelMaxWidth,
    );

    return centers.map((center) => ({ center, dimensions }));
  });

  const preferredDimensions = getLabelDimensions(
    safeTextWidth,
    preferredSegment.length,
    labelMaxWidth,
  );
  const safeCandidate = candidates.find(
    ({ center, dimensions }) =>
      !intersectsNode(center, dimensions.width, dimensions.height, nodes),
  );

  if (safeCandidate) {
    return {
      center: safeCandidate.center,
      ...safeCandidate.dimensions,
    };
  }

  // If the graph is too dense for a clear candidate, preserve the preferred
  // path location. The label still wraps and remains available via title/
  // aria-label, while later layout updates can retry collision-free anchors.
  return {
    center: preferredCenter,
    ...preferredDimensions,
  };
};
