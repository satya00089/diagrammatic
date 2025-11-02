import React from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import { MdSettings, MdDelete } from "react-icons/md";
import { motion } from "framer-motion";

export interface GroupNodeData {
  label: string;
  icon?: string;
  subtitle?: string;
  backgroundColor?: string;
  borderColor?: string;
}

interface GroupNodeProps {
  id: string;
  data: GroupNodeData;
}

const GroupNode: React.FC<GroupNodeProps> = ({ id, data }) => {
  const bgColor = data.backgroundColor || "rgba(100, 100, 255, 0.05)";
  const borderColor = data.borderColor || "rgba(100, 100, 255, 0.3)";

  const onDelete = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      globalThis.dispatchEvent(
        new CustomEvent("diagram:node-delete", { detail: { id } }),
      );
    },
    [id],
  );

  const onToggle = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      globalThis.dispatchEvent(
        new CustomEvent("diagram:node-toggle", { detail: { id } }),
      );
    },
    [id],
  );

  return (
    <div
      className="group-node"
      style={{
        padding: "20px",
        borderRadius: "12px",
        border: `2px dashed ${borderColor}`,
        backgroundColor: bgColor,
        minWidth: "300px",
        minHeight: "200px",
        height: "100%",
        position: "relative",
      }}
    >
      {/* Node Resizer - allows resizing the group */}
      <NodeResizer
        minWidth={300}
        minHeight={200}
        isVisible={true}
        lineStyle={{
          borderColor: borderColor,
          borderWidth: 2,
          borderStyle: "dashed",
        }}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: "2px",
          backgroundColor: "var(--surface)",
          border: `2px solid ${borderColor}`,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      />

      {/* Action buttons - positioned at top-right */}
      <div className="absolute -top-3 right-2 flex items-center z-10 bg-[var(--surface)]/90 border border-theme rounded-full shadow-sm">
        <motion.button
          type="button"
          aria-label="Settings"
          onClick={onToggle}
          className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center"
          title="Group Settings"
          whileHover={{ scale: 1.1, y: -1, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <MdSettings className="w-3 h-3" />
        </motion.button>
        <motion.button
          type="button"
          aria-label="Delete Group"
          onClick={onDelete}
          className="p-1 text-red-600 rounded-full hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center"
          title="Delete Group"
          whileHover={{ scale: 1.15, y: -2, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <MdDelete className="w-3 h-3" />
        </motion.button>
      </div>

      {/* Group Header */}
      <div
        className="group-header"
        style={{
          position: "absolute",
          top: "-12px",
          left: "10px",
          padding: "4px 12px",
          borderRadius: "6px",
          backgroundColor: "var(--surface)",
          border: `1px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "14px",
          fontWeight: "600",
          color: "var(--theme)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        {data.icon && <span>{data.icon}</span>}
        <span>{data.label}</span>
      </div>

      {/* Group Subtitle */}
      {data.subtitle && (
        <div
          style={{
            marginTop: "8px",
            fontSize: "12px",
            color: "var(--muted)",
            fontStyle: "italic",
          }}
        >
          {data.subtitle}
        </div>
      )}

      {/* Handles for connections - invisible but available in all directions */}
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        isConnectable={true}
        style={{
          width: "100%",
          height: "8px",
          background: "transparent",
          border: "none",
          opacity: 0,
          cursor: "crosshair",
        }}
      />

      <Handle
        id="right"
        type="source"
        position={Position.Right}
        isConnectable={true}
        style={{
          width: "8px",
          height: "100%",
          background: "transparent",
          border: "none",
          opacity: 0,
          cursor: "crosshair",
        }}
      />

      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        isConnectable={true}
        style={{
          width: "100%",
          height: "8px",
          background: "transparent",
          border: "none",
          opacity: 0,
          cursor: "crosshair",
        }}
      />

      <Handle
        id="left"
        type="source"
        position={Position.Left}
        isConnectable={true}
        style={{
          width: "8px",
          height: "100%",
          background: "transparent",
          border: "none",
          opacity: 0,
          cursor: "crosshair",
        }}
      />
    </div>
  );
};

export default GroupNode;
