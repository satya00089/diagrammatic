import React, { useState, useRef, useEffect } from "react";
import type { EdgeProps, ReactFlowState, Position } from "@xyflow/react";
import {
  getBezierPath,
  getEdgeCenter,
  getStraightPath,
  getSmoothStepPath,
  useStore,
} from "@xyflow/react";

export type EdgePathType = "bezier" | "straight" | "step" | "smoothstep";

/** Resolve a CSS custom property to its actual computed value so html-to-image can capture it. */
function resolveCssVar(varName: string, fallback: string): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return raw || fallback;
}

// Helper function for creating curved paths for bi-directional edges
const getSpecialPath = (
  {
    sourceX,
    sourceY,
    targetX,
    targetY,
  }: { sourceX: number; sourceY: number; targetX: number; targetY: number },
  offset: number,
) => {
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;
  return `M ${sourceX} ${sourceY} Q ${centerX} ${centerY + offset} ${targetX} ${targetY}`;
};

// Compute edge path and center point; extracted to reduce complexity in the main component
const computeEdgeParams = (
  params: {
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: Position;
    targetPosition: Position;
  },
  isBiDirectionEdge: boolean,
  pathType: EdgePathType = "bezier",
) => {
  const { sourceX, sourceY, targetX, targetY } = params;

  // When two edges connect the same nodes in opposite directions, offset the curve
  if (isBiDirectionEdge) {
    const offset = sourceX < targetX ? 25 : -25;
    const edgePath = getSpecialPath(
      { sourceX, sourceY, targetX, targetY },
      offset,
    );
    const centerX = (sourceX + targetX) / 2;
    const centerY = (sourceY + targetY) / 2 + offset / 2;
    return { edgePath, centerX, centerY };
  }

  if (pathType === "straight") {
    const [edgePath, centerX, centerY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
    return { edgePath, centerX, centerY };
  }

  if (pathType === "step") {
    const [edgePath, centerX, centerY] = getSmoothStepPath({ ...params, borderRadius: 0 });
    return { edgePath, centerX, centerY };
  }

  if (pathType === "smoothstep") {
    const [edgePath, centerX, centerY] = getSmoothStepPath(params);
    return { edgePath, centerX, centerY };
  }

  // Default: bezier
  const [edgePath] = getBezierPath(params);
  const [centerX, centerY] = getEdgeCenter({ sourceX, sourceY, targetX, targetY });
  return { edgePath, centerX, centerY };
};

const CustomEdge: React.FC<EdgeProps> = (props) => {
  const {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
    markerEnd,
  } = props;

  const edgeData = data as {
    label?: string;
    hasLabel?: boolean;
    description?: string;
    pathType?: EdgePathType;
    color?: string;
    strokeWidth?: number;
    animated?: boolean;
    bidirectional?: boolean;
  } | undefined;

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string>(edgeData?.label ?? "");
  const [hasLabel, setHasLabel] = useState<boolean>(edgeData?.hasLabel ?? false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync label/hasLabel when edge data changes (e.g. after undo/redo or collab)
  useEffect(() => {
    setValue(edgeData?.label ?? "");
    setHasLabel(edgeData?.hasLabel ?? false);
  }, [edgeData?.label, edgeData?.hasLabel]);

  // Resolve CSS variables to real color values so html-to-image can capture them.
  const [resolvedColors, setResolvedColors] = useState({
    surface: "#ffffff",
    text: "#111827",
    border: "#e5e7eb",
    brand: "#6366f1",
    bgHover: "#f3f4f6",
  });
  useEffect(() => {
    const update = () =>
      setResolvedColors({
        surface: resolveCssVar("--surface", "#ffffff"),
        text:    resolveCssVar("--text", "#111827"),
        border:  resolveCssVar("--border", "#e5e7eb"),
        brand:   resolveCssVar("--brand", "#6366f1"),
        bgHover: resolveCssVar("--bg-hover", "#f3f4f6"),
      });
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Detect if there's a bi-directional connection
  const isBiDirectionEdge = useStore((s: ReactFlowState) =>
    s.edges.some(
      (e) =>
        e.id !== id &&
        e.source === target &&
        e.target === source,
    ),
  );

  // Calculate path and center using extracted helper
  const pathType: EdgePathType = (edgeData?.pathType) || "bezier";
  const edgeColor = edgeData?.color || (selected ? resolvedColors.brand : resolvedColors.text + "99");
  const strokeW = edgeData?.strokeWidth ?? (selected ? 3 : 2);
  const isBidirectional = edgeData?.bidirectional ?? false;

  const edgePathParams = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  };
  const { edgePath, centerX, centerY } = computeEdgeParams(
    edgePathParams,
    isBiDirectionEdge,
    pathType,
  );

  const onLabelDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onAddLabel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasLabel(true);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onRemoveLabel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasLabel(false);
    setValue("");
    // broadcast update
    globalThis.dispatchEvent(
      new CustomEvent("diagram:edge-label-change", {
        detail: { id, label: "", hasLabel: false },
      }),
    );
  };

  const commit = () => {
    setEditing(false);
    // broadcast update — playground listens and updates edge state
    globalThis.dispatchEvent(
      new CustomEvent("diagram:edge-label-change", {
        detail: {
          id,
          label: value,
          hasLabel: hasLabel || value.trim().length > 0,
        },
      }),
    );
  };

  return (
    <g className="react-flow__edge">
      <defs>
        <marker
          id={`arrow-${id}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={edgeColor} />
        </marker>
        {isBidirectional && (
          <marker
            id={`arrow-start-${id}`}
            viewBox="0 0 10 10"
            refX="2"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={edgeColor} />
          </marker>
        )}
      </defs>

      {/* Wider transparent hit-area for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
      />

      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={edgeColor}
        strokeWidth={strokeW}
        strokeDasharray={edgeData?.animated ? "6 3" : undefined}
        markerEnd={markerEnd || `url(#arrow-${id})`}
        markerStart={isBidirectional ? `url(#arrow-start-${id})` : undefined}
        className="transition-colors"
      />

      {/* Label area — foreignObject sized generously; inner div centres content */}
      <foreignObject
        x={centerX - 80}
        y={centerY - 20}
        width={160}
        height={40}
        style={{ overflow: "visible" }}
      >
        <div
          style={{
            width: "160px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "auto",
            overflow: "visible",
          }}
        >
          {hasLabel ? (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {editing ? (
                <input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onBlur={commit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commit();
                    if (e.key === "Escape") {
                      setEditing(false);
                      setValue(edgeData?.label ?? "");
                    }
                  }}
                  style={{
                    fontSize: "11px",
                    border: `1px solid ${resolvedColors.border}`,
                    borderRadius: "4px",
                    padding: "2px 8px",
                    backgroundColor: resolvedColors.surface,
                    color: resolvedColors.text,
                    width: "96px",
                    textAlign: "center",
                    outline: "none",
                    boxShadow: `0 0 0 2px ${resolvedColors.brand}55`,
                  }}
                  placeholder="Label..."
                />
              ) : (
                <>
                  <button
                    onDoubleClick={onLabelDoubleClick}
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      cursor: "text",
                      backgroundColor: resolvedColors.surface,
                      color: resolvedColors.text,
                      border: `1px solid ${selected ? resolvedColors.brand : resolvedColors.border}`,
                      boxShadow: selected ? `0 0 0 1px ${resolvedColors.brand}` : "none",
                      textAlign: "center",
                      minWidth: "60px",
                      whiteSpace: "nowrap",
                    }}
                    title="Double-click to edit"
                    type="button"
                  >
                    {value || "Label"}
                  </button>
                  {selected && (
                    <button
                      onClick={onRemoveLabel}
                      style={{
                        fontSize: "11px",
                        padding: "2px 4px",
                        borderRadius: "4px",
                        backgroundColor: "#fee2e2",
                        color: "#b91c1c",
                        border: "none",
                        cursor: "pointer",
                      }}
                      title="Remove label"
                    >
                      ✕
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            selected && (
              <button
                onClick={onAddLabel}
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor: resolvedColors.surface,
                  color: resolvedColors.brand,
                  border: `1px dashed ${resolvedColors.brand}`,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
                title="Add label"
              >
                + Label
              </button>
            )
          )}
        </div>
      </foreignObject>
    </g>
  );
};

export default CustomEdge;
