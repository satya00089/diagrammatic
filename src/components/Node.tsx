import React from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";

type NodeData = {
  label: string;
  icon?: string;
  subtitle?: string;
};

type Props = {
  id: string;
  data: NodeData;
};

const Node: React.FC<Props> = ({ id, data }) => {
  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent("diagram:node-delete", { detail: { id } })
    );
  };

  const onToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent("diagram:node-toggle", { detail: { id } })
    );
  };

  return (
    <motion.fieldset
      initial={{ y: 0, opacity: 1 }}
      whileHover={{ y: -1, boxShadow: "0 12px 30px rgba(0,0,0,0.12)" }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="min-w-[140px] w-full max-w-xs bg-surface border border-theme rounded-lg px-3 py-2 flex items-center gap-3 text-theme text-sm shadow-sm cursor-grab"
    >
      <legend className="sr-only">{data.label}</legend>
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        isConnectable={true}
        style={{
          width: 10,
          height: 10,
          background: "var(--brand)",
          borderRadius: 6,
          border: "2px solid var(--surface)",
        }}
      />
      <Handle
        id="left" 
        type="target"
        position={Position.Left}
        isConnectable={true}
        style={{
          width: 10,
          height: 10,
          background: "var(--brand)",
          borderRadius: 6,
          border: "2px solid var(--surface)",
        }}
      />

      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-lg">
          {data.icon ?? "●"}
        </div>

        <div className="min-w-0">
          <div className="truncate font-medium text-sm">{data.label}</div>
          {data.subtitle && (
            <div className="text-xs text-muted truncate">{data.subtitle}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="More"
          onClick={onToggle}
          className="p-1 rounded hover:bg-[var(--bg-hover)]"
          title="Settings"
        >
          ⋯
        </button>
        <button
          type="button"
          aria-label="Delete"
          onClick={onDelete}
          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
          title="Delete"
        >
          🗑
        </button>
      </div>
    </motion.fieldset>
  );
};

export default Node;
