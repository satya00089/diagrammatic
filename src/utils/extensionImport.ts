import type { Edge, Node } from "@xyflow/react";
import type {
  ExtensionImportResult,
  ExtensionKind,
} from "../types/extensions";
import { COMPONENTS } from "../config/components";

type TableAttribute = {
  id: string;
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isNullable?: boolean;
};

const cleanLabel = (value: string): string =>
  value
    .replaceAll(/^['"]|['"]$/g, "")
    .replaceAll(/<br\s*\/?>(\s*)/gi, " ")
    .trim();

const makeId = (prefix: string, value: string, index: number): string =>
  `${prefix}-${value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-") || index}`;

const layoutNodes = (nodes: Node[]): Node[] => {
  const columns = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: (index % columns) * 280,
      y: Math.floor(index / columns) * 190,
    },
  }));
};

const normalizeComponentName = (value: string): string =>
  value.toLowerCase().replaceAll(/[^a-z0-9]+/g, " ").trim();

const normalizeSqlIdentifier = (value: string): string =>
  value
    .trim()
    .replaceAll(/"|`|\[|\]/g, "")
    .replaceAll(/\s*\.\s*/g, ".")
    .toLowerCase();

const sqlIdentifierPart =
  '"(?:[^"]|"")+"|`[^`]+`|\\[[^\\]]+\\]|[\\w$#-]+';
const sqlIdentifier = `(?:${sqlIdentifierPart})(?:\\s*\\.\\s*(?:${sqlIdentifierPart}))*`;

const resolveLocalComponent = (key: string, label: string) => {
  const candidates = [key, label].map(normalizeComponentName);
  const exactMatch = COMPONENTS.find((component) =>
    candidates.some(
      (candidate) =>
        candidate === normalizeComponentName(component.id) ||
        candidate === normalizeComponentName(component.label),
    ),
  );
  if (exactMatch) return exactMatch;

  const haystack = candidates.join(" ");
  const preferredId =
    /\b(api gateway|gateway)\b/.test(haystack)
      ? "api-gateway"
      : /\b(database|db|postgres|postgresql|mysql|mongodb|redis)\b/.test(
            haystack,
          )
        ? "database"
        : undefined;

  return preferredId
    ? COMPONENTS.find((component) => component.id === preferredId)
    : undefined;
};

const parseMermaid = (source: string): ExtensionImportResult => {
  const nodesByKey = new Map<string, Node>();
  const edges: Edge[] = [];
  const warnings: string[] = [];
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.replaceAll(/%%.*$/g, "").trim())
    .filter(Boolean);

  if (!lines.some((line) => /^(flowchart|graph|sequenceDiagram|erDiagram)\b/i.test(line))) {
    warnings.push("Add a Mermaid diagram declaration such as `flowchart LR`.");
  }

  const ensureNode = (key: string, label?: string) => {
    const normalizedKey = key.trim();
    if (!normalizedKey || /^(subgraph|end|flowchart|graph)$/i.test(normalizedKey)) {
      return;
    }
    const resolvedLabel = cleanLabel(label || normalizedKey);
    const localComponent = resolveLocalComponent(normalizedKey, resolvedLabel);
    const subtitle = localComponent?.description ?? "Microservice";
    const existingNode = nodesByKey.get(normalizedKey);
    if (existingNode) {
      if (label) {
        const existingData = { ...existingNode.data };
        delete existingData.componentId;
        delete existingData.architectureType;
        existingNode.data = {
          ...existingData,
          label: resolvedLabel,
          subtitle,
          ...(localComponent
            ? { componentId: localComponent.id }
            : { architectureType: "microservice" }),
        };
      }
      return;
    }

    nodesByKey.set(normalizedKey, {
        id: makeId("mermaid", normalizedKey, nodesByKey.size),
        type: "custom",
        position: { x: 0, y: 0 },
        data: {
          label: resolvedLabel,
          subtitle,
          ...(localComponent
            ? { componentId: localComponent.id }
            : { architectureType: "microservice" }),
          extensionSource: "mermaid",
          extensionSourceKey: normalizedKey,
        },
      });
  };

  const declarationPattern = /([A-Za-z0-9_:-]+)\s*(?:\[([^\]]+)\]|\(\(([^)]+)\)\)|\{([^}]+)\}|\(([^)]+)\))/g;
  const edgePattern = /^([A-Za-z0-9_:-]+).*?(?:-->|-.->|==>|---|--\s+).*?([A-Za-z0-9_:-]+)(?:\s*\|([^|]+)\|)?/;

  for (const line of lines) {
    for (const declaration of line.matchAll(declarationPattern)) {
      ensureNode(declaration[1], declaration.slice(2).find(Boolean));
    }

    const edge = line.match(edgePattern);
    if (edge && edge[1] !== edge[2]) {
      ensureNode(edge[1]);
      ensureNode(edge[2]);
      const sourceNode = nodesByKey.get(edge[1]);
      const targetNode = nodesByKey.get(edge[2]);
      if (sourceNode && targetNode) {
        edges.push({
          id: `mermaid-edge-${edges.length}`,
          source: sourceNode.id,
          sourceHandle: "right",
          target: targetNode.id,
          targetHandle: "left",
          type: "customEdge",
          label: edge[3] ? cleanLabel(edge[3]) : undefined,
          data: {
            extensionSource: "mermaid",
            extensionSourceKey: `${edge[1]}-${edge[2]}`,
          },
        });
      }
    }
  }

  if (nodesByKey.size === 0) {
    throw new Error("No Mermaid nodes were recognized. Check the syntax and try again.");
  }

  const nodes = layoutNodes(Array.from(nodesByKey.values()));
  const catalogMatches = nodes.filter(
    (node) => typeof node.data.componentId === "string",
  ).length;
  return {
    nodes,
    edges,
    warnings,
    summary: `${nodes.length} nodes and ${edges.length} connections recognized`,
    catalogMatches,
    fallbackNodes: nodes.length - catalogMatches,
  };
};

const parseDatabaseSchema = (source: string): ExtensionImportResult => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const warnings: string[] = [];
  const tableIds = new Map<string, string>();
  const relationships: Array<{
    childId: string;
    parentTableName: string;
    column: string;
  }> = [];
  const attributesByTableId = new Map<string, TableAttribute[]>();
  const tableBlocks = source.matchAll(
    new RegExp(
      String.raw`create\s+table\s+(?:if\s+not\s+exists\s+)?(${sqlIdentifier})\s*\(([^;]*)\)\s*(?:[^;]*)?;?`,
      "gis",
    ),
  );

  for (const [index, match] of Array.from(tableBlocks).entries()) {
    const tableName = match[1];
    const body = match[2];
    const attributes: TableAttribute[] = [];
    const primaryColumns = new Set<string>();
    const foreignKeyColumns = new Set<string>();
    const inlineForeignKeys: Array<{ column: string; target: string }> = [];

    for (const rawLine of body.split(/,(?![^()]*\))/)) {
      const line = rawLine.trim().replaceAll(/[\r\n]+/g, " ");
      if (!line) continue;
      const tablePrimaryKey = line.match(/primary\s+key\s*\(([^)]+)\)/i);
      if (tablePrimaryKey) {
        tablePrimaryKey[1]
          .split(",")
          .forEach((column) => primaryColumns.add(normalizeSqlIdentifier(column)));
        continue;
      }
      const foreignKey = line.match(
        new RegExp(
          String.raw`foreign\s+key\s*\(([^)]+)\)\s*references\s+(${sqlIdentifier})`,
          "i",
        ),
      );
      if (foreignKey) {
        const columns = foreignKey[1].split(",").map((column) => {
          const name = normalizeSqlIdentifier(column);
          foreignKeyColumns.add(name);
          return name;
        });
        inlineForeignKeys.push({
          column: columns.join(", "),
          target: foreignKey[2],
        });
        continue;
      }
      if (/^(constraint|unique|check|primary\s+key)/i.test(line)) continue;
      const column = line.match(
        new RegExp(
          String.raw`^(${sqlIdentifierPart})\s+([\w]+(?:\s*\([^)]*\))?)`,
          "i",
        ),
      );
      if (!column) {
        warnings.push(`Skipped an unrecognized definition in ${tableName}.`);
        continue;
      }
      const name = normalizeSqlIdentifier(column[1]);
      attributes.push({
        id: `${tableName}-${name}`,
        name,
        type: column[2].toUpperCase(),
        isPrimaryKey: /primary\s+key/i.test(line),
        isNullable: !/not\s+null/i.test(line),
      });
      if (/primary\s+key/i.test(line)) primaryColumns.add(name);
      const inlineReference = line.match(
        new RegExp(String.raw`references\s+(${sqlIdentifier})`, "i"),
      );
      if (inlineReference) {
        foreignKeyColumns.add(name);
        inlineForeignKeys.push({ column: name, target: inlineReference[1] });
      }
    }

    attributes.forEach((attribute) => {
      if (primaryColumns.has(attribute.name)) attribute.isPrimaryKey = true;
      if (foreignKeyColumns.has(attribute.name)) attribute.isForeignKey = true;
    });
    const id = makeId("table", tableName, index);
    tableIds.set(normalizeSqlIdentifier(tableName), id);
    attributesByTableId.set(id, attributes);
    nodes.push({
      id,
      type: "tableNode",
      position: { x: 0, y: 0 },
      data: {
        label: tableName,
        componentName: tableName,
        attributes,
        nodeType: "entity",
        extensionSource: "database-schema",
      },
    });

    inlineForeignKeys.forEach((relation) => {
      relationships.push({
        childId: id,
        parentTableName: relation.target,
        column: relation.column,
      });
    });
  }

  // pgAdmin exports relationships separately, after all CREATE TABLE blocks:
  // ALTER TABLE IF EXISTS public.orders ADD CONSTRAINT ... FOREIGN KEY (...)
  // REFERENCES public.users (...). Parse those constraints in a second pass so
  // forward references and schema-qualified names both resolve correctly.
  const deferredForeignKeys = source.matchAll(
    new RegExp(
      String.raw`alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?(${sqlIdentifier})\s+add\s+(?:constraint\s+(?:${sqlIdentifierPart})\s+)?foreign\s+key\s*\(([^)]+)\)\s*references\s+(${sqlIdentifier})`,
      "gis",
    ),
  );
  for (const foreignKey of deferredForeignKeys) {
    const childTable = foreignKey[1];
    const parentTable = foreignKey[3];
    const childId = tableIds.get(normalizeSqlIdentifier(childTable));
    if (!childId) {
      warnings.push(`Could not find table ${childTable} for a foreign key.`);
      continue;
    }

    const attributes = attributesByTableId.get(childId) ?? [];
    const columns = foreignKey[2].split(",").map((rawColumn) => {
      const column = normalizeSqlIdentifier(rawColumn);
      const attribute = attributes.find(
        (candidate) => normalizeSqlIdentifier(candidate.name) === column,
      );
      if (attribute) attribute.isForeignKey = true;
      return column;
    });
    relationships.push({
      childId,
      parentTableName: parentTable,
      column: columns.join(", "),
    });
  }

  if (nodes.length === 0) {
    throw new Error("No CREATE TABLE statements were recognized. Paste a supported SQL schema.");
  }
  const childIdsByParent = new Map<string, string[]>();
  const inDegree = new Map(nodes.map((node) => [node.id, 0]));

  relationships.forEach((relationship) => {
    const parentId = tableIds.get(
      normalizeSqlIdentifier(relationship.parentTableName),
    );
    if (!parentId) {
      warnings.push(
        `Could not link ${relationship.column}: table ${relationship.parentTableName} was not found.`,
      );
      return;
    }

    edges.push({
      id: `schema-edge-${edges.length}`,
      source: parentId,
      sourceHandle: "right",
      target: relationship.childId,
      targetHandle: "left",
      type: "erRelationship",
      label: relationship.column,
      data: {
        extensionSource: "database-schema",
        label: relationship.column,
        hasLabel: true,
        cardinality: "one-to-many",
        pathType: "step",
      },
    });
    childIdsByParent.set(parentId, [
      ...(childIdsByParent.get(parentId) ?? []),
      relationship.childId,
    ]);
    inDegree.set(
      relationship.childId,
      (inDegree.get(relationship.childId) ?? 0) + 1,
    );
  });

  const ready = nodes
    .filter((node) => (inDegree.get(node.id) ?? 0) === 0)
    .map((node) => node.id);
  const orderedNodeIds: string[] = [];
  while (ready.length > 0) {
    const nodeId = ready.shift();
    if (!nodeId) continue;
    orderedNodeIds.push(nodeId);
    (childIdsByParent.get(nodeId) ?? []).forEach((childId) => {
      const remaining = (inDegree.get(childId) ?? 1) - 1;
      inDegree.set(childId, remaining);
      if (remaining === 0) ready.push(childId);
    });
  }
  nodes.forEach((node) => {
    if (!orderedNodeIds.includes(node.id)) orderedNodeIds.push(node.id);
  });
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const orderedNodes = orderedNodeIds.flatMap((nodeId) => {
    const node = nodesById.get(nodeId);
    return node ? [node] : [];
  });

  if (relationships.length > 0 && edges.length === 0) {
    warnings.push("Foreign keys were found, but no referenced tables could be linked.");
  }

  return {
    nodes: layoutNodes(orderedNodes),
    edges,
    warnings,
    summary: `${nodes.length} tables and ${edges.length} relationships recognized`,
    fallbackNodes: nodes.length,
  };
};

export const parseExtensionSource = (
  kind: ExtensionKind,
  source: string,
): ExtensionImportResult => {
  if (!source.trim()) throw new Error("Paste source code before importing.");
  return kind === "mermaid" ? parseMermaid(source) : parseDatabaseSchema(source);
};
