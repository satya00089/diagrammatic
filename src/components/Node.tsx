import React from "react";
import ReactDOM from "react-dom";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { MdSettings, MdDelete } from "react-icons/md";
import { IoDuplicateOutline } from "react-icons/io5";
import { FiUnlock } from "react-icons/fi";
import { BiDotsVertical } from "react-icons/bi";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import NodePropertyDisplay from "./NodePropertyDisplay";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import SpriteIcon from "./SpriteIcon";
import { loadSpriteManifest } from "../store/slices/spritesSlice";

/** Extract provider slug from a component ID like "aws-cognito" → "aws" */
function providerFromId(id: string): string | null {
  const prefix = id.split("-")[0].toLowerCase();
  return ["aws", "azure", "gcp", "kubernetes"].includes(prefix) ? prefix : null;
}

export type NodeData = {
  label: string;
  icon?: React.ComponentType;
  iconUrl?: string;
  subtitle?: string;
  componentName?: string;
  _customProperties?: CustomProperty[];
  [key: string]:
    | string
    | number
    | boolean
    | React.ComponentType
    | CustomProperty[]
    | undefined; // Allow for additional dynamic properties
};

import type { PropertyValue } from "../types/canvas";

export interface CustomProperty {
  id: string;
  key: string;
  label: string;
  type: string;
  value: PropertyValue;
}

type Props = {
  id: string;
  data: NodeData;
  onCopy?: (id: string, data: NodeData) => void;
  isInGroup?: boolean;
};

const Node: React.FC<Props> = React.memo(({ id, data, onCopy, isInGroup }) => {
  const dispatch = useAppDispatch();
  const spriteIcons = useAppSelector((state) => state.sprites.allIcons);
  const componentId = typeof data.componentId === "string" ? data.componentId : undefined;
  const sprite = componentId ? spriteIcons[componentId] : undefined;
  const provider = componentId ? providerFromId(componentId) : null;
  // Select only this node's provider status to avoid re-renders from other providers loading.
  const spriteStatus = useAppSelector((state) =>
    provider ? state.sprites.providerStatus[provider] : undefined
  );
  // For known sprite providers (aws/azure/gcp/kubernetes): NEVER fire iconUrl <img>.
  // Show nothing while loading (status undefined or 'loading'), sprite once ready.
  // Only fall back to iconUrl if sprite load definitively failed (status 'error'),
  // or if this is a non-cloud component with no sprite provider at all.
  const showIconUrl = !sprite && !!data.iconUrl && (!provider || spriteStatus === "error");

  // Self-load sprite manifest for this node's provider if not already loaded.
  // condition in the thunk handles deduplication (won't re-fetch if loading/ready).
  React.useEffect(() => {
    if (!componentId) return;
    const p = providerFromId(componentId);
    if (!p) return;
    dispatch(loadSpriteManifest(p));
  }, [componentId, dispatch]);

  const [contextMenu, setContextMenu] = React.useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);
  const [showProperties, setShowProperties] = React.useState(false);

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

  const handleContextMenu = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  }, []);

  const handleMenuButtonHover = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({
      visible: true,
      x: rect.left,
      y: rect.bottom + 4,
    });
  }, []);

  const closeContextMenu = React.useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, []);

  const toggleProperties = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowProperties((prev) => !prev);
  }, []);

  // Close menu on outside click
  React.useEffect(() => {
    if (contextMenu.visible) {
      const handleClick = (e: MouseEvent) => {
        // Only close if clicking outside the menu
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
      <motion.fieldset
        initial={{ y: 0, opacity: 1 }}
        whileHover={{ y: -1, boxShadow: "0 12px 30px rgba(0,0,0,0.12)" }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="min-w-[200px] w-full max-w-[15vw] bg-surface border border-theme rounded-lg text-theme text-sm shadow-sm cursor-grab relative p-3"
        style={{
          ...(data.backgroundColor ? { backgroundColor: data.backgroundColor as string } : {}),
          ...(data.borderColor ? { borderLeftColor: data.borderColor as string, borderLeftWidth: "3px" } : {}),
          ...(data.textColor ? { color: data.textColor as string } : {}),
        }}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <legend className="sr-only">{displayLabel}</legend>

        {/* Eye Toggle Button - Visible on hover */}
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
          transition={{ duration: 0.15 }}
          onClick={toggleProperties}
          className="absolute top-2 right-10 z-10 w-6 h-6 flex items-center justify-center 
            rounded-md backdrop-blur-md border border-white/20
            shadow-md hover:shadow-lg cursor-pointer"
          style={{
            pointerEvents: isHovered ? "auto" : "none",
            backgroundColor: data.backgroundColor
              ? `${data.backgroundColor as string}99`
              : "color-mix(in srgb, var(--surface) 90%, transparent)",
            color: (data.borderColor as string) || "var(--text-theme)",
          }}
        >
          {showProperties ? (
            <AiOutlineEye className="w-4 h-4" />
          ) : (
            <AiOutlineEyeInvisible className="w-4 h-4" />
          )}
        </motion.button>

        {/* Menu Button - Visible on hover */}
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
          transition={{ duration: 0.15 }}
          onClick={handleMenuButtonHover}
          className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center 
            rounded-md backdrop-blur-md border border-white/20
            shadow-md hover:shadow-lg cursor-pointer"
          style={{
            pointerEvents: isHovered ? "auto" : "none",
            backgroundColor: data.backgroundColor
              ? `${data.backgroundColor as string}99`
              : "color-mix(in srgb, var(--surface) 90%, transparent)",
            color: (data.borderColor as string) || "var(--text-theme)",
          }}
        >
          <BiDotsVertical className="w-4 h-4" />
        </motion.button>

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
          {sprite ? (
            <div className="flex-shrink-0 flex items-center justify-center">
              <SpriteIcon sprite={sprite} displaySize={64} alt={displayLabel} />
            </div>
          ) : showIconUrl ? (
            <div className="flex-shrink-0 flex items-center justify-center">
              <img
                src={data.iconUrl}
                alt={displayLabel}
                className="w-full h-full object-contain"
                style={{ maxWidth: "10rem", maxHeight: "10rem" }}
              />
            </div>
          ) : (
            <div
              className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl relative overflow-hidden"
              style={data.borderColor ? {
                background: `linear-gradient(135deg, ${data.borderColor as string}30, ${data.borderColor as string}10)`,
              } : {
                background: "linear-gradient(135deg, color-mix(in srgb, var(--brand) 20%, transparent), color-mix(in srgb, var(--brand) 5%, transparent))",
              }}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={data.borderColor ? {
                  background: `linear-gradient(135deg, transparent, ${data.borderColor as string}18)`,
                } : {
                  background: "linear-gradient(135deg, transparent, color-mix(in srgb, var(--brand) 10%, transparent))",
                }}
              />
              <div
                className="relative z-10 opacity-80"
                style={data.borderColor ? { color: data.borderColor as string } : undefined}
              >
                {data.icon
                  ? React.createElement(
                      data.icon as React.ComponentType<{ size?: number }>,
                      { size: 24 },
                    )
                  : "●"}
              </div>
            </div>
          )}

          <div className="min-w-0 w-full text-center">
            <div className="truncate font-medium text-sm">{displayLabel}</div>
            {data.subtitle && (
              <div className="text-xs opacity-70 truncate">{data.subtitle}</div>
            )}
          </div>
        </div>

        {/* Properties Section - Toggleable */}
        {showProperties && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 pt-3 border-t border-theme/10 nowheel"
          >
            <div className="text-xs space-y-2">
              {/* Display all node properties except system ones */}
              {(() => {
                const excludeKeys = new Set([
                  "label",
                  "icon",
                  "iconUrl",
                  "subtitle",
                  "componentId",
                  "componentName",
                  "_customProperties",
                  "backgroundColor",
                  "borderColor",
                  "textColor",
                ]);
                const isEmptyValue = (val: unknown): boolean => {
                  if (val === undefined || val === null || val === "") return true;
                  if (typeof val === "string") {
                    const stripped = val.replaceAll(/<[^>]*>/g, "").trim();
                    return stripped === "";
                  }
                  return false;
                };
                const properties = Object.entries(data).filter(
                  ([key, val]) => !excludeKeys.has(key) && !isEmptyValue(val),
                );

                if (
                  properties.length === 0 &&
                  (!data._customProperties ||
                    !Array.isArray(data._customProperties) ||
                    data._customProperties.length === 0)
                ) {
                  return (
                    <div className="opacity-60 text-center py-2">
                      No properties
                    </div>
                  );
                }

                return (
                  <>
                    {properties.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold opacity-60 uppercase tracking-wide">
                          Standard Properties
                        </div>
                        {properties.map(([key, value]) => (
                          <NodePropertyDisplay
                            key={key}
                            propertyKey={key}
                            value={value}
                          />
                        ))}
                      </div>
                    )}

                    {/* Display custom properties last */}
                    {data._customProperties &&
                      Array.isArray(data._customProperties) &&
                      data._customProperties.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold opacity-60 uppercase tracking-wide">
                            Custom Properties
                          </div>
                          {data._customProperties.map(
                            (customProp: CustomProperty) => (
                              <NodePropertyDisplay
                                key={customProp.id}
                                propertyKey={customProp.label || customProp.key}
                                value={customProp.value}
                              />
                            ),
                          )}
                        </div>
                      )}
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
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
          document.body,
        )}
    </>
  );
});

Node.displayName = "Node";

export default Node;
