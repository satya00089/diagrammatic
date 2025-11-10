import React, { useState, useRef } from "react";
import type { EdgeProps, ReactFlowState, Position } from "@xyflow/react";
import { getBezierPath, getEdgeCenter, useStore } from "@xyflow/react";

// Cardinality types for ER relationships
export type ERCardinality = 
  // Basic cardinalities
  | "one-to-one"           // 1:1
  | "one-to-many"          // 1:N
  | "many-to-one"          // N:1
  | "many-to-many"         // N:M
  
  // Mandatory participation (must participate)
  | "mandatory-one-to-one"      // 1:1 (both sides mandatory)
  | "mandatory-one-to-many"     // 1:N (both sides mandatory)
  | "mandatory-many-to-many"    // M:N (both sides mandatory)
  
  // Optional participation (may or may not participate)
  | "optional-zero-to-one"      // 0:1 (optional on both sides)
  | "optional-zero-to-many"     // 0:N (optional zero or many)
  | "optional-many-to-many"     // 0:M to 0:N (optional on both)
  
  // Mixed participation
  | "one-mandatory-many-optional"  // 1 to 0..N (one side mandatory, other optional)
  | "zero-to-one"                  // 0..1 (zero or one)
  | "zero-to-many"                 // 0..N (zero or many)
  | "one-or-many"                  // 1..N (one or many - at least one)
  
  // Recursive relationships (self-referencing)
  | "recursive-one-to-one"      // Self 1:1
  | "recursive-one-to-many"     // Self 1:N
  | "recursive-many-to-many";   // Self M:N

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

// Compute edge path and center point
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

// Get marker definitions for different cardinalities
const getSourceMarker = (cardinality: ERCardinality) => {
  switch (cardinality) {
    // Basic one at source
    case "one-to-one":
    case "one-to-many":
    case "zero-to-one":
    case "one-mandatory-many-optional":
    case "one-or-many":
      return "one";
    
    // Many/crow's foot at source
    case "many-to-one":
    case "many-to-many":
    case "mandatory-many-to-many":
    case "optional-many-to-many":
      return "many";
    
    // Mandatory (double line) at source
    case "mandatory-one-to-one":
    case "mandatory-one-to-many":
      return "mandatory-one";
    
    // Optional (circle + line) at source
    case "optional-zero-to-one":
    case "optional-zero-to-many":
    case "zero-to-many":
      return "optional-zero";
    
    // Recursive relationships
    case "recursive-one-to-one":
      return "one";
    case "recursive-one-to-many":
      return "one";
    case "recursive-many-to-many":
      return "many";
    
    default:
      return "one";
  }
};

const getTargetMarker = (cardinality: ERCardinality) => {
  switch (cardinality) {
    // Basic one at target
    case "one-to-one":
    case "many-to-one":
    case "zero-to-one":
      return "one";
    
    // Many/crow's foot at target
    case "one-to-many":
    case "many-to-many":
    case "zero-to-many":
    case "one-mandatory-many-optional":
    case "one-or-many":
      return "many";
    
    // Mandatory (double line) at target
    case "mandatory-one-to-one":
      return "mandatory-one";
    case "mandatory-one-to-many":
    case "mandatory-many-to-many":
      return "mandatory-many";
    
    // Optional (circle + crow's foot) at target
    case "optional-zero-to-one":
      return "optional-one";
    case "optional-zero-to-many":
    case "optional-many-to-many":
      return "optional-many";
    
    // Recursive relationships
    case "recursive-one-to-one":
      return "one";
    case "recursive-one-to-many":
      return "many";
    case "recursive-many-to-many":
      return "many";
    
    default:
      return "many";
  }
};

interface EREdgeData {
  label?: string;
  hasLabel?: boolean;
  cardinality?: ERCardinality;
}

const ERRelationshipEdge: React.FC<EdgeProps> = (props) => {
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
  } = props;
  
  const edgeData = (data as EREdgeData) || {};
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string>(edgeData.label ?? "");
  const [hasLabel, setHasLabel] = useState<boolean>(edgeData.hasLabel ?? false);
  const [cardinality, setCardinality] = useState<ERCardinality>(
    edgeData.cardinality ?? "one-to-many"
  );
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Detect if there's a bi-directional connection
  const isBiDirectionEdge = useStore((s: ReactFlowState) => {
    const edgeExists = s.edges.some(
      (e) =>
        e.id !== id &&
        e.source === target &&
        e.target === source,
    );
    return edgeExists;
  });

  // Calculate path and center
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
    globalThis.dispatchEvent(
      new CustomEvent("diagram:edge-label-change", {
        detail: { id, label: "", hasLabel: false },
      }),
    );
  };

  const commit = () => {
    setEditing(false);
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

  const handleCardinalityChange = (newCardinality: ERCardinality) => {
    setCardinality(newCardinality);
    globalThis.dispatchEvent(
      new CustomEvent("diagram:edge-cardinality-change", {
        detail: { id, cardinality: newCardinality },
      }),
    );
  };

  const sourceMarkerType = getSourceMarker(cardinality);
  const targetMarkerType = getTargetMarker(cardinality);

  return (
    <g className="react-flow__edge">
      <defs>
        {/* One (single line) marker */}
        <marker
          id={`er-one-${id}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <line x1="0" y1="0" x2="0" y2="10" stroke="var(--brand)" strokeWidth="2" />
        </marker>

        {/* Many (crow's foot) marker */}
        <marker
          id={`er-many-${id}`}
          viewBox="0 0 20 20"
          refX="18"
          refY="10"
          markerWidth="12"
          markerHeight="12"
          orient="auto"
        >
          {/* Crow's foot - three lines spreading out */}
          <line x1="0" y1="10" x2="15" y2="10" stroke="var(--brand)" strokeWidth="2" />
          <line x1="15" y1="10" x2="20" y2="5" stroke="var(--brand)" strokeWidth="2" />
          <line x1="15" y1="10" x2="20" y2="15" stroke="var(--brand)" strokeWidth="2" />
        </marker>

        {/* Mandatory One (double line) marker */}
        <marker
          id={`er-mandatory-one-${id}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <line x1="0" y1="0" x2="0" y2="10" stroke="var(--brand)" strokeWidth="2" />
          <line x1="3" y1="0" x2="3" y2="10" stroke="var(--brand)" strokeWidth="2" />
        </marker>

        {/* Mandatory Many (double line + crow's foot) marker */}
        <marker
          id={`er-mandatory-many-${id}`}
          viewBox="0 0 20 20"
          refX="18"
          refY="10"
          markerWidth="12"
          markerHeight="12"
          orient="auto"
        >
          {/* Double lines for mandatory */}
          <line x1="0" y1="10" x2="12" y2="10" stroke="var(--brand)" strokeWidth="2" />
          <line x1="3" y1="8" x2="3" y2="12" stroke="var(--brand)" strokeWidth="2" />
          {/* Crow's foot for many */}
          <line x1="12" y1="10" x2="20" y2="5" stroke="var(--brand)" strokeWidth="2" />
          <line x1="12" y1="10" x2="20" y2="15" stroke="var(--brand)" strokeWidth="2" />
        </marker>

        {/* Optional Zero (circle) marker */}
        <marker
          id={`er-optional-zero-${id}`}
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="10"
          markerHeight="10"
          orient="auto"
        >
          <circle cx="6" cy="6" r="3" fill="none" stroke="var(--brand)" strokeWidth="2" />
        </marker>

        {/* Optional One (circle + line) marker */}
        <marker
          id={`er-optional-one-${id}`}
          viewBox="0 0 15 12"
          refX="14"
          refY="6"
          markerWidth="12"
          markerHeight="10"
          orient="auto"
        >
          <circle cx="4" cy="6" r="3" fill="none" stroke="var(--brand)" strokeWidth="1.5" />
          <line x1="10" y1="0" x2="10" y2="12" stroke="var(--brand)" strokeWidth="2" />
        </marker>

        {/* Optional Many (circle + crow's foot) marker */}
        <marker
          id={`er-optional-many-${id}`}
          viewBox="0 0 25 20"
          refX="23"
          refY="10"
          markerWidth="14"
          markerHeight="12"
          orient="auto"
        >
          <circle cx="4" cy="10" r="3" fill="none" stroke="var(--brand)" strokeWidth="1.5" />
          <line x1="10" y1="10" x2="18" y2="10" stroke="var(--brand)" strokeWidth="2" />
          <line x1="18" y1="10" x2="25" y2="5" stroke="var(--brand)" strokeWidth="2" />
          <line x1="18" y1="10" x2="25" y2="15" stroke="var(--brand)" strokeWidth="2" />
        </marker>

        {/* Source markers (pointing backwards) */}
        <marker
          id={`er-one-source-${id}`}
          viewBox="0 0 10 10"
          refX="1"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <line x1="10" y1="0" x2="10" y2="10" stroke="var(--brand)" strokeWidth="2" />
        </marker>

        <marker
          id={`er-many-source-${id}`}
          viewBox="0 0 20 20"
          refX="2"
          refY="10"
          markerWidth="12"
          markerHeight="12"
          orient="auto"
        >
          {/* Crow's foot - three lines spreading out (reversed) */}
          <line x1="20" y1="10" x2="5" y2="10" stroke="var(--brand)" strokeWidth="2" />
          <line x1="5" y1="10" x2="0" y2="5" stroke="var(--brand)" strokeWidth="2" />
          <line x1="5" y1="10" x2="0" y2="15" stroke="var(--brand)" strokeWidth="2" />
        </marker>

        <marker
          id={`er-mandatory-one-source-${id}`}
          viewBox="0 0 10 10"
          refX="1"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <line x1="10" y1="0" x2="10" y2="10" stroke="var(--brand)" strokeWidth="2" />
          <line x1="7" y1="0" x2="7" y2="10" stroke="var(--brand)" strokeWidth="2" />
        </marker>

        <marker
          id={`er-optional-zero-source-${id}`}
          viewBox="0 0 12 12"
          refX="2"
          refY="6"
          markerWidth="10"
          markerHeight="10"
          orient="auto"
        >
          <circle cx="6" cy="6" r="3" fill="none" stroke="var(--brand)" strokeWidth="2" />
        </marker>
      </defs>

      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={selected ? "var(--brand)" : "var(--muted)"}
        strokeWidth={selected ? 3 : 2}
        markerEnd={`url(#er-${targetMarkerType}-${id})`}
        markerStart={`url(#er-${sourceMarkerType}-source-${id})`}
        className="transition-colors"
      />

      {/* Label and cardinality selector */}
      <foreignObject
        x={centerX - 100}
        y={centerY - 40}
        width={200}
        height={80}
        className="overflow-visible"
      >
        <div className="flex flex-col items-center justify-center w-full h-full pointer-events-auto gap-2">
          {/* Label area */}
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
                      setValue(edgeData.label ?? "");
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
                      type="button"
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
                type="button"
              >
                + Label
              </button>
            )
          )}

          {/* Cardinality selector - only show when edge is selected */}
          {selected && (
            <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--brand)] rounded px-2 py-1">
              <select
                value={cardinality}
                onChange={(e) => handleCardinalityChange(e.target.value as ERCardinality)}
                className="text-xs bg-transparent text-theme focus:outline-none cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <optgroup label="─── Basic Cardinality ───">
                  <option value="one-to-one">1:1 (One to One)</option>
                  <option value="one-to-many">1:N (One to Many)</option>
                  <option value="many-to-one">N:1 (Many to One)</option>
                  <option value="many-to-many">N:M (Many to Many)</option>
                </optgroup>
                
                <optgroup label="─── Mandatory (Must Participate) ───">
                  <option value="mandatory-one-to-one">1:1 Mandatory (Both must exist)</option>
                  <option value="mandatory-one-to-many">1:N Mandatory (Both must exist)</option>
                  <option value="mandatory-many-to-many">M:N Mandatory (Both must exist)</option>
                </optgroup>
                
                <optgroup label="─── Optional (May Participate) ───">
                  <option value="optional-zero-to-one">0:1 Optional (Zero or One)</option>
                  <option value="optional-zero-to-many">0:N Optional (Zero or Many)</option>
                  <option value="optional-many-to-many">0:M to 0:N Optional (Both optional)</option>
                </optgroup>
                
                <optgroup label="─── Mixed Participation ───">
                  <option value="one-mandatory-many-optional">1 to 0..N (One mandatory, many optional)</option>
                  <option value="zero-to-one">0..1 (Zero or One)</option>
                  <option value="zero-to-many">0..N (Zero or Many)</option>
                  <option value="one-or-many">1..N (One or Many - at least one)</option>
                </optgroup>
                
                <optgroup label="─── Recursive (Self-Referencing) ───">
                  <option value="recursive-one-to-one">Self 1:1 (Recursive One-to-One)</option>
                  <option value="recursive-one-to-many">Self 1:N (Recursive One-to-Many)</option>
                  <option value="recursive-many-to-many">Self M:N (Recursive Many-to-Many)</option>
                </optgroup>
              </select>
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  );
};

export default ERRelationshipEdge;
