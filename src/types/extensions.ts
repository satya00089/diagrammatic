import type { Edge, Node } from "@xyflow/react";

export type ExtensionKind = "mermaid" | "database-schema";

export type ExtensionImportResult = {
  nodes: Node[];
  edges: Edge[];
  warnings: string[];
  summary: string;
  catalogMatches?: number;
  fallbackNodes?: number;
};
