import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { MdSettings, MdDelete, MdAdd } from "react-icons/md";
import { IoDuplicateOutline } from "react-icons/io5";
import { FiUnlock } from "react-icons/fi";
import type { NodeRenderConfig } from "../types/canvas";

export type TableAttribute = {
  id: string;
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isUnique?: boolean;
  isNullable?: boolean;
};

export type TableNodeData = {
  label: string;
  icon?: string;
  componentName?: string;
  componentId?: string; // Component ID like 'uml-class', 'entity', etc.
  description?: string;
  attributes?: TableAttribute[] | string; // Can be array or JSON string
  renderConfig?: NodeRenderConfig; // Column configuration
  [key: string]: unknown;
};

type Props = {
  id: string;
  data: TableNodeData;
  onCopy?: (id: string, data: TableNodeData) => void;
  isInGroup?: boolean;
};

const TableNode: React.FC<Props> = React.memo(
  ({ id, data, onCopy, isInGroup }) => {
    const [contextMenu, setContextMenu] = useState<{
      visible: boolean;
      x: number;
      y: number;
    }>({ visible: false, x: 0, y: 0 });

    const [editingAttrId, setEditingAttrId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState({ name: "", type: "" });

    const displayLabel = data.componentName || data.label;

    // Parse attributes - it might be a JSON string or already an array
    const attributes = React.useMemo(() => {
      if (!data.attributes) return [];
      if (Array.isArray(data.attributes)) return data.attributes;
      if (typeof data.attributes === "string") {
        try {
          const parsed = JSON.parse(data.attributes);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    }, [data.attributes]);

    // Get column configuration from renderConfig or use defaults
    const columns = React.useMemo(() => {
      if (data.renderConfig?.columns && data.renderConfig.columns.length > 0) {
        return data.renderConfig.columns;
      }
      // Default columns for database table
      return [
        { key: "pk", label: "PK", width: "w-6" },
        { key: "name", label: "Column Name", width: "flex-1" },
        { key: "type", label: "Data Type", width: "w-24" },
        { key: "actions", label: "", width: "w-8" },
      ];
    }, [data.renderConfig]);

    const onDelete = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        globalThis.dispatchEvent(
          new CustomEvent("diagram:node-delete", { detail: { id } }),
        );
      },
      [id],
    );

    const onToggle = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        globalThis.dispatchEvent(
          new CustomEvent("diagram:node-toggle", { detail: { id } }),
        );
      },
      [id],
    );

    const handleCopy = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onCopy?.(id, data);
      },
      [id, data, onCopy],
    );

    const handleDetach = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        globalThis.dispatchEvent(
          new CustomEvent("diagram:node-detach", { detail: { id } }),
        );
      },
      [id],
    );

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
      });
    }, []);

    const closeContextMenu = useCallback(() => {
      setContextMenu({ visible: false, x: 0, y: 0 });
    }, []);

    const handleDeleteAttribute = useCallback(
      (attrId: string) => {
        globalThis.dispatchEvent(
          new CustomEvent("diagram:table-attribute-delete", {
            detail: { nodeId: id, attributeId: attrId },
          }),
        );
      },
      [id],
    );

    // Add new attribute
    const handleAddAttribute = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();

        // Determine if this is a UML Class or Entity based on componentId
        const isUMLClass = data.componentId?.startsWith("uml-");

        const newAttr: TableAttribute = isUMLClass
          ? {
              id: `attr-${Date.now()}`,
              name: "+ newMethod()",
              type: "void",
              isNullable: false,
            }
          : {
              id: `attr-${Date.now()}`,
              name: "newColumn",
              type: "VARCHAR(255)",
              isNullable: true,
            };

        globalThis.dispatchEvent(
          new CustomEvent("diagram:table-attribute-add", {
            detail: { nodeId: id, attribute: newAttr },
          }),
        );
      },
      [id, data.componentId],
    );

    // Start editing attribute
    const handleStartEdit = useCallback(
      (attr: TableAttribute, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingAttrId(attr.id);
        setEditingValue({ name: attr.name, type: attr.type });
      },
      [],
    );

    // Save attribute edit
    const handleSaveEdit = useCallback(() => {
      if (editingAttrId) {
        globalThis.dispatchEvent(
          new CustomEvent("diagram:table-attribute-update", {
            detail: {
              nodeId: id,
              attributeId: editingAttrId,
              name: editingValue.name,
              type: editingValue.type,
            },
          }),
        );
        setEditingAttrId(null);
      }
    }, [id, editingAttrId, editingValue]);

    // Cancel edit
    const handleCancelEdit = useCallback(() => {
      setEditingAttrId(null);
    }, []);

    // Generic toggle handler for boolean columns
    const handleToggleBoolean = useCallback(
      (attrId: string, key: string) => {
        globalThis.dispatchEvent(
          new CustomEvent("diagram:table-attribute-toggle", {
            detail: { nodeId: id, attributeId: attrId, key },
          }),
        );
      },
      [id],
    );

    // Render individual column cell based on column configuration
    const renderColumnCell = useCallback(
      (col: (typeof columns)[0], attr: TableAttribute, isEditing: boolean) => {
        const cellClassName = col.width || "flex-1";
        const attrValue = attr[col.key as keyof TableAttribute];

        // Boolean type - render as toggle button
        if (col.type === "boolean") {
          const boolValue = Boolean(attrValue);
          // For isNullable, we invert the logic (unchecked = nullable, checked = NOT NULL)
          const isInverted = col.key === "isNullable";
          const displayValue = isInverted ? !boolValue : boolValue;
          const icon = displayValue ? col.icon?.active : col.icon?.inactive;
          const colorClass = displayValue
            ? col.color?.active
            : col.color?.inactive;

          return (
            <button
              key={col.key}
              type="button"
              onClick={() => handleToggleBoolean(attr.id, col.key)}
              className={`${cellClassName} flex items-center justify-center ${colorClass || ""}`}
              title={col.label}
            >
              {icon ? (
                <span className="text-xs">{icon}</span>
              ) : (
                <div className="w-3 h-3 border border-theme/40 rounded" />
              )}
            </button>
          );
        }

        // Text type - editable field
        if (col.type === "text" && col.editable) {
          if (isEditing) {
            return (
              <input
                key={col.key}
                type="text"
                value={String(
                  editingValue[col.key as keyof typeof editingValue] ||
                    attrValue ||
                    "",
                )}
                onChange={(e) =>
                  setEditingValue({
                    ...editingValue,
                    [col.key]: e.target.value,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                className={`${cellClassName} px-1 py-0.5 bg-surface border border-theme/40 rounded text-xs`}
                autoFocus={col.key === "name"}
                onClick={(e) => e.stopPropagation()}
              />
            );
          }

          // Determine color based on attribute properties
          let textColorClass = "text-xs cursor-pointer";
          if (col.key === "name") {
            if (attr.isPrimaryKey) {
              textColorClass +=
                " font-semibold text-yellow-600 dark:text-yellow-400";
            } else if (attr.isForeignKey) {
              textColorClass += " text-blue-600 dark:text-blue-400";
            }
          } else if (col.key === "type") {
            textColorClass += " text-muted";
          }

          return (
            <span
              key={col.key}
              className={`${cellClassName} truncate ${textColorClass}`}
              onDoubleClick={(e) => handleStartEdit(attr, e)}
              title="Double-click to edit"
              role="button"
              tabIndex={0}
            >
              {String(attrValue || "")}
            </span>
          );
        }

        // Readonly type - actions column
        if (col.type === "readonly" && col.key === "actions") {
          if (isEditing) {
            return (
              <button
                key="actions"
                type="button"
                onClick={handleSaveEdit}
                className={`${cellClassName} text-green-600 hover:text-green-700 text-xs`}
                title="Save"
              >
                ✓
              </button>
            );
          }
          return (
            <button
              key="actions"
              type="button"
              onClick={() => handleDeleteAttribute(attr.id)}
              className={`${cellClassName} opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 transition-opacity`}
              title="Delete attribute"
            >
              <MdDelete className="w-3 h-3" />
            </button>
          );
        }

        // Default fallback
        return (
          <span key={col.key} className={cellClassName}>
            {String(attrValue || "")}
          </span>
        );
      },
      [
        handleToggleBoolean,
        handleDeleteAttribute,
        handleStartEdit,
        handleSaveEdit,
        handleCancelEdit,
        editingValue,
      ],
    );

    React.useEffect(() => {
      if (contextMenu.visible) {
        const handleClick = (e: MouseEvent) => {
          const menu = document.querySelector("[data-context-menu]");
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
        <motion.div
          initial={{ y: 0, opacity: 1 }}
          whileHover={{ y: -1, boxShadow: "0 12px 30px rgba(0,0,0,0.12)" }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="min-w-[220px] max-h-[500px] bg-surface border-2 border-theme text-theme text-sm shadow-lg cursor-grab relative rounded-lg overflow-hidden flex flex-col"
          onContextMenu={handleContextMenu}
        >
          {/* Connection Handles */}
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

          {/* Table Header */}
          <div className="bg-[var(--brand)] text-white px-3 py-2 font-semibold flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              {data.icon && <span className="text-lg">{data.icon}</span>}
              <span>{displayLabel}</span>
            </div>
            <button
              type="button"
              onClick={handleAddAttribute}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Add attribute"
            >
              <MdAdd className="w-4 h-4" />
            </button>
          </div>

          {/* Column Headers */}
          <div className="bg-[var(--bg-hover)] px-3 py-1 border-b border-theme/20 flex items-center gap-2 text-xs font-semibold flex-shrink-0">
            {columns.map((col) => (
              <span
                key={col.key}
                className={col.width || "flex-1"}
                style={{ textAlign: col.align || "left" }}
              >
                {col.label}
              </span>
            ))}
          </div>

          {/* Attributes List */}
          <div className="divide-y divide-theme/10 overflow-y-auto flex-1 table-node-scroll">
            {attributes.map((attr) => {
              const isEditing = editingAttrId === attr.id;
              return (
                <div
                  key={attr.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-hover)] group"
                >
                  {columns.map((col) => renderColumnCell(col, attr, isEditing))}
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {attributes.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-muted">
              Click + to add attributes
            </div>
          )}
        </motion.div>

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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddAttribute(e);
                  closeContextMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 text-sm"
              >
                <MdAdd className="w-4 h-4" />
                Add Attribute
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
            document.body,
          )}
      </>
    );
  },
);

TableNode.displayName = "TableNode";

export default TableNode;
