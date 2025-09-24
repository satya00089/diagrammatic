import React, { useState, useRef } from "react";
import type { EdgeProps, ReactFlowState, Position } from "@xyflow/react";
import { getBezierPath, getEdgeCenter, useStore } from "@xyflow/react";

// Helper function for creating curved paths for bi-directional edges
const getSpecialPath = (
  { sourceX, sourceY, targetX, targetY }: { sourceX: number; sourceY: number; targetX: number; targetY: number },
  offset: number,
) => {
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;
  return `M ${sourceX} ${sourceY} Q ${centerX} ${centerY + offset} ${targetX} ${targetY}`;
};

// Compute edge path and center point; extracted to reduce complexity in the main component
const computeEdgeParams = (
  params: { sourceX: number; sourceY: number; targetX: number; targetY: number; sourcePosition: Position; targetPosition: Position },
  isBiDirectionEdge: boolean,
) => {
  const { sourceX, sourceY, targetX, targetY } = params;

  if (isBiDirectionEdge) {
    const offset = sourceX < targetX ? 25 : -25;
    const edgePath = getSpecialPath({ sourceX, sourceY, targetX, targetY }, offset);
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    const centerX = midX;
    const centerY = midY + offset / 2;
    return { edgePath, centerX, centerY };
  }

  const [edgePath] = getBezierPath(params);
  const [centerX, centerY] = getEdgeCenter({ sourceX, sourceY, targetX, targetY });
  return { edgePath, centerX, centerY };
};

const CustomEdge: React.FC<EdgeProps> = (props) => {
  const { id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected, markerEnd } = props;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string>((data as { label?: string })?.label ?? "");
  const [hasLabel, setHasLabel] = useState<boolean>((data as { hasLabel?: boolean })?.hasLabel ?? false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Detect if there's a bi-directional connection
  const isBiDirectionEdge = useStore((s: ReactFlowState) => {
    const edgeExists = s.edges.some(
      (e) =>
        e.id !== id && // exclude current edge
        ((e.source === target && e.target === source))
    );
    if (edgeExists) {
      console.log(`Bi-directional edge detected: ${id} (${source} -> ${target})`);
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
  const { edgePath, centerX, centerY } = computeEdgeParams(edgePathParams, isBiDirectionEdge);

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
    window.dispatchEvent(
      new CustomEvent("diagram:edge-label-change", { 
        detail: { id, label: "", hasLabel: false } 
      })
    );
  };

  const commit = () => {
    setEditing(false);
    // broadcast update — playground listens and updates edge state
    window.dispatchEvent(
      new CustomEvent("diagram:edge-label-change", { 
        detail: { id, label: value, hasLabel: hasLabel || value.trim().length > 0 } 
      })
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

      {/* Label area */}
      <foreignObject 
        x={centerX - 75} 
        y={centerY - 12} 
        width={150} 
        height={24}
        className="overflow-visible"
      >
        <div className="flex items-center justify-center w-full h-full pointer-events-auto">
            {hasLabel ? (
              <div className="flex items-center gap-1">
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
                    className="text-xs border rounded px-2 py-1 bg-[var(--surface)] text-theme w-24 text-center focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                    placeholder="Label..."
                  />
                ) : (
                  <>
                    <button
                      onDoubleClick={onLabelDoubleClick}
                      className={`text-xs px-2 py-1 rounded cursor-text bg-[var(--surface)] text-theme border text-center min-w-[60px] hover:bg-[var(--bg-hover)] ${
                        selected ? "ring-1 ring-[var(--brand)]" : "border-theme"
                      }`}
                      title="Double-click to edit"
                      type="button"
                    >
                      {value || "Label"}
                    </button>
                    {selected && (
                      <button
                        onClick={onRemoveLabel}
                        className="text-xs px-1 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
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
                  className="text-xs px-2 py-1 rounded bg-[var(--surface)] border border-dashed border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--bg-hover)]"
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
