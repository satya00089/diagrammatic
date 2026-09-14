type ERTableNodeData = {
  componentId?: unknown;
  nodeType?: unknown;
};

const ER_TABLE_IDENTIFIERS = new Set([
  "entity",
  "weak-entity",
  "er-view",
  "view",
]);

/**
 * ER tables share field-level handles and content-sized rendering, regardless
 * of whether the source component is an entity, weak entity, or view.
 */
export const isFieldAddressableERTable = (
  data: ERTableNodeData | null | undefined,
): boolean => {
  const componentId =
    typeof data?.componentId === "string" ? data.componentId : undefined;
  const nodeType =
    typeof data?.nodeType === "string" ? data.nodeType : undefined;

  return Boolean(
    (componentId && ER_TABLE_IDENTIFIERS.has(componentId)) ||
      (nodeType && ER_TABLE_IDENTIFIERS.has(nodeType)),
  );
};
