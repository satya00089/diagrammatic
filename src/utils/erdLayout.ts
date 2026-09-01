import type { Edge, Node } from "@xyflow/react";
import ELK, { type ElkNode, type ElkPort } from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

const FIELD_HANDLE_PREFIX = "field:";
// Match the existing table-node layout width so an unmeasured entity graph
// still gets enough separation before React Flow reports actual dimensions.
const DEFAULT_ENTITY_WIDTH = 400;
const TABLE_CHROME_HEIGHT = 72;
const ATTRIBUTE_ROW_HEIGHT = 36;

export type ERDLayoutDirection = "TB" | "LR";

type EntityAttribute = {
  id: string;
};

const getNodeData = (node: Node): Record<string, unknown> =>
  (node.data ?? {}) as Record<string, unknown>;

const getAttributes = (node: Node): EntityAttribute[] => {
  const rawAttributes = getNodeData(node).attributes;
  if (Array.isArray(rawAttributes)) {
    return rawAttributes.filter(
      (attribute): attribute is EntityAttribute =>
        typeof attribute === "object" &&
        attribute !== null &&
        typeof (attribute as { id?: unknown }).id === "string",
    );
  }

  if (typeof rawAttributes === "string") {
    try {
      const parsed = JSON.parse(rawAttributes);
      return Array.isArray(parsed)
        ? parsed.filter(
            (attribute): attribute is EntityAttribute =>
              typeof attribute === "object" &&
              attribute !== null &&
              typeof (attribute as { id?: unknown }).id === "string",
          )
        : [];
    } catch {
      return [];
    }
  }

  return [];
};

export const isEntityTableNode = (node: Node): boolean => {
  const data = getNodeData(node);
  return (
    node.type === "tableNode" &&
    (data.componentId === "entity" || data.nodeType === "entity")
  );
};

export const canUseERDLayout = (nodes: Node[]): boolean => {
  const topLevelNodes = nodes.filter(
    (node) => node.type !== "group" && !node.parentId,
  );

  return topLevelNodes.length > 0 && topLevelNodes.every(isEntityTableNode);
};

const getPositiveDimension = (...values: unknown[]): number | undefined =>
  values.find(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value) && value > 0,
  );

const getEntityDimensions = (node: Node) => {
  const attributes = getAttributes(node);
  const width = getPositiveDimension(
    node.measured?.width,
    node.width,
    (node.style as { width?: unknown } | undefined)?.width,
  );
  const height = getPositiveDimension(
    node.measured?.height,
    node.height,
    (node.style as { height?: unknown } | undefined)?.height,
  );

  return {
    width: width ?? DEFAULT_ENTITY_WIDTH,
    height:
      height ?? TABLE_CHROME_HEIGHT + attributes.length * ATTRIBUTE_ROW_HEIGHT,
  };
};

const getFieldPortId = (nodeId: string, handleId: string): string =>
  `${nodeId}::${handleId}`;

const getEntityPorts = (node: Node): ElkPort[] => {
  const attributes = getAttributes(node);
  const sides = [
    { side: "WEST", suffix: "left", attributes: [...attributes].reverse() },
    { side: "EAST", suffix: "right", attributes },
  ] as const;

  return sides.flatMap(({ side, suffix, attributes: suffixAttributes }) =>
    suffixAttributes.map((attribute) => ({
      id: getFieldPortId(
        node.id,
        `${FIELD_HANDLE_PREFIX}${attribute.id}:${suffix}`,
      ),
      width: 1,
      height: 1,
      layoutOptions: {
        "org.eclipse.elk.port.side": side,
      },
    })),
  );
};

const getEdgeEndpoint = (
  nodeId: string,
  handleId: string | null | undefined,
): string =>
  handleId?.startsWith(FIELD_HANDLE_PREFIX)
    ? getFieldPortId(nodeId, handleId)
    : nodeId;

export const getERDLayoutedNodes = async (
  nodes: Node[],
  edges: Edge[],
  direction: ERDLayoutDirection = "TB",
): Promise<Node[]> => {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const graph: ElkNode = {
    id: "erd-root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction === "LR" ? "RIGHT" : "DOWN",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.spacing.nodeNodeBetweenLayers": "120",
      "elk.spacing.nodeNode": "80",
    },
    children: nodes.map((node) => {
      const dimensions = getEntityDimensions(node);
      return {
        id: node.id,
        width: dimensions.width,
        height: dimensions.height,
        ports: getEntityPorts(node),
        layoutOptions: {
          "org.eclipse.elk.portConstraints": "FIXED_ORDER",
        },
      };
    }),
    edges: edges
      .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .map((edge) => ({
        id: edge.id,
        sources: [getEdgeEndpoint(edge.source, edge.sourceHandle)],
        targets: [getEdgeEndpoint(edge.target, edge.targetHandle)],
      })),
  };

  const layoutedGraph = await elk.layout(graph);
  const positions = new Map(
    (layoutedGraph.children ?? []).map((node) => [
      node.id,
      { x: node.x ?? 0, y: node.y ?? 0 },
    ]),
  );

  return nodes.map((node) => {
    const position = positions.get(node.id);
    return position ? { ...node, position } : node;
  });
};
