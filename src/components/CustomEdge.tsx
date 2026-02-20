import React, { useState, useRef, useEffect } from "react";
import type { EdgeProps, ReactFlowState, Position } from "@xyflow/react";
import { getBezierPath, getEdgeCenter, useStore } from "@xyflow/react";

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
) => {
  const { sourceX, sourceY, targetX, targetY } = params;

  if (isBiDirectionEdge) {
    const offset = sourceX < targetX ? 25 : -25;
    const edgePath = getSpecialPath(
      { sourceX, sourceY, targetX, targetY },
      offset,
    );
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    const centerX = midX;
    const centerY = midY + offset / 2;
    return { edgePath, centerX, centerY };
  }

  const [edgePath] = getBezierPath(params);
  const [centerX, centerY] = getEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });
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
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string>(
    (data as { label?: string })?.label ?? "",
  );
  const [hasLabel, setHasLabel] = useState<boolean>(
    (data as { hasLabel?: boolean })?.hasLabel ?? false,
  );
  const inputRef = useRef<HTMLInputElement | null>(null);

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
  const isBiDirectionEdge = useStore((s: ReactFlowState) => {
    const edgeExists = s.edges.some(
      (e) =>
        e.id !== id && // exclude current edge
        e.source === target &&
        e.target === source,
    );
    if (edgeExists) {
      console.log(
        `Bi-directional edge detected: ${id} (${source} -> ${target})`,
      );
    }
    return edgeExists;
  });

  // Calculate path and center using extracted helper
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
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--brand)" />
        </marker>
      </defs>

      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={selected ? "var(--brand)" : "var(--muted)"}
        strokeWidth={selected ? 3 : 2}
        markerEnd={markerEnd || `url(#arrow-${id})`}
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
                      setValue((data as { label?: string })?.label ?? "");
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
