import React from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { MdSettings, MdDelete, MdCopyAll } from "react-icons/md";

export type NodeData = {
  label: string;
  icon?: string;
  subtitle?: string;
  componentName?: string;
  [key: string]: string | number | boolean | undefined; // Allow for additional dynamic properties
};

type Props = {
  id: string;
  data: NodeData;
  onCopy?: (id: string, data: NodeData) => void;
};

const Node: React.FC<Props> = React.memo(({ id, data, onCopy }) => {
  // Use componentName if available, otherwise fall back to label
  const displayLabel = data.componentName || data.label;

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

  const handleCopy = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onCopy?.(id, data);
    },
    [id, data, onCopy],
  );

  return (
    <motion.fieldset
      initial={{ y: 0, opacity: 1 }}
      whileHover={{ y: -1, boxShadow: "0 12px 30px rgba(0,0,0,0.12)" }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="min-w-[140px] w-full max-w-xs bg-surface border border-theme rounded-lg text-theme text-sm shadow-sm cursor-grab relative"
    >
      <legend className="sr-only">{displayLabel}</legend>

      {/* Action buttons - positioned at top-right */}
      <div className="absolute -top-5 right-1 flex items-center z-10 bg-[var(--surface)]/80 border border-theme rounded-full shadow-sm">
        <motion.button
          type="button"
          aria-label="Settings"
          onClick={onToggle}
          className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center"
          title="Settings"
          whileHover={{ scale: 1.1, y: -1, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <MdSettings className="w-2 h-2" />
        </motion.button>
        <motion.button
          type="button"
          aria-label="Copy Node"
          onClick={handleCopy}
          className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center"
          title="Copy Node"
          whileHover={{ scale: 1.1, y: -1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <MdCopyAll className="w-2 h-2" />
        </motion.button>
        <motion.button
          type="button"
          aria-label="Delete"
          onClick={onDelete}
          className="p-1 text-red-600 rounded-full hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center"
          title="Delete"
          whileHover={{ scale: 1.15, y: -2, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <MdDelete className="w-2 h-2" />
        </motion.button>
      </div>

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

      {/* Main content */}
      <div className="flex flex-col items-center justify-center gap-2 min-w-0 w-full py-2">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-xl">
          {data.icon ?? "●"}
        </div>

        <div className="min-w-0 w-full text-center">
          <div className="truncate font-medium text-sm">{displayLabel}</div>
          {data.subtitle && (
            <div className="text-xs text-muted truncate">{data.subtitle}</div>
          )}
        </div>
      </div>
    </motion.fieldset>
  );
});

Node.displayName = "Node";

export default Node;
