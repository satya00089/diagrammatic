import React from "react";
import ReactDOM from "react-dom";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { MdSettings, MdDelete } from "react-icons/md";
import { IoDuplicateOutline } from "react-icons/io5";
import { FiUnlock } from "react-icons/fi";

export type NodeData = {
  label: string;
  icon?: React.ComponentType;
  iconUrl?: string;
  subtitle?: string;
  componentName?: string;
  [key: string]: string | number | boolean | React.ComponentType | undefined; // Allow for additional dynamic properties
};

type Props = {
  id: string;
  data: NodeData;
  onCopy?: (id: string, data: NodeData) => void;
  isInGroup?: boolean;
};

const Node: React.FC<Props> = React.memo(({ id, data, onCopy, isInGroup }) => {
  const [contextMenu, setContextMenu] = React.useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

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

  const handleDetach = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      globalThis.dispatchEvent(
        new CustomEvent("diagram:node-detach", { detail: { id } }),
      );
    },
    [id],
  );

  const handleContextMenu = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [],
  );

  const closeContextMenu = React.useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, []);

  // Close menu on outside click
  React.useEffect(() => {
    if (contextMenu.visible) {
      const handleClick = (e: MouseEvent) => {
        // Only close if clicking outside the menu
        const menu = document.querySelector('[data-context-menu]');
        if (menu && !menu.contains(e.target as Node)) {
          closeContextMenu();
        }
      };
      document.addEventListener("click", handleClick);
      document.addEventListener("contextmenu", handleClick);
      return () => {
        document.removeEventListener("click", handleClick);
        document.removeEventListener("contextmenu", handleClick);
      };
    }
  }, [contextMenu.visible, closeContextMenu]);

  return (
    <>
      <motion.fieldset
        initial={{ y: 0, opacity: 1 }}
        whileHover={{ y: -1, boxShadow: "0 12px 30px rgba(0,0,0,0.12)" }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="min-w-[140px] w-full max-w-xs bg-surface border border-theme rounded-lg text-theme text-sm shadow-sm cursor-grab relative p-3"
        onContextMenu={handleContextMenu}
      >
        <legend className="sr-only">{displayLabel}</legend>

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

        {/* Main content */}
        <div className="flex flex-col items-center justify-center gap-2 min-w-0 w-full py-2">
          {data.iconUrl ? (
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
              <img 
                src={data.iconUrl} 
                alt={displayLabel}
                className="w-12 h-12 object-contain"
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[var(--brand)]/20 to-[var(--brand)]/5 flex items-center justify-center text-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[var(--brand)]/10 rounded-full"></div>
              <div className="relative z-10 opacity-80">
                {data.icon ? React.createElement(data.icon as React.ComponentType<{size?: number}>, { size: 24 }) : "●"}
              </div>
            </div>
          )}

          <div className="min-w-0 w-full text-center">
            <div className="truncate font-medium text-sm">{displayLabel}</div>
            {data.subtitle && (
              <div className="text-xs text-muted truncate">{data.subtitle}</div>
            )}
          </div>
        </div>
      </motion.fieldset>

      {/* Context Menu Portal */}
      {contextMenu.visible &&
        ReactDOM.createPortal(
          <motion.div
            data-context-menu
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed z-[10000] bg-[var(--surface)] border border-theme rounded-lg shadow-lg py-1 min-w-[140px] pointer-events-auto"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              transform: "translate(-50%, -10px)",
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(e);
                closeContextMenu();
              }}
              className="w-full px-3 py-2 text-left hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 text-sm"
            >
              <MdSettings className="w-4 h-4" />
              Settings
            </button>
            {isInGroup && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDetach(e);
                  closeContextMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 text-sm text-orange-500"
              >
                <FiUnlock className="w-4 h-4" />
                Detach from Group
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(e);
                closeContextMenu();
              }}
              className="w-full px-3 py-2 text-left hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 text-sm"
            >
              <IoDuplicateOutline className="w-4 h-4" />
              Duplicate
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(e);
                closeContextMenu();
              }}
              className="w-full px-3 py-2 text-left hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 text-sm text-red-600"
            >
              <MdDelete className="w-4 h-4" />
              Delete
            </button>
          </motion.div>,
          document.body
        )}
    </>
  );
});

Node.displayName = "Node";

export default Node;
