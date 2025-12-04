import React from "react";

export type ComponentProperty = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "boolean" | "select";
  default?: string | number | boolean;
  placeholder?: string;
  options?: string[];
};

export type NodeSection = {
  type: "header" | "attributes" | "methods" | "content";
  editable?: boolean; // Can user add/remove rows
  style?: Record<string, string>;
};

export type TableColumn = {
  key: string; // Unique identifier for the column (matches attribute property)
  label: string; // Display label in header
  width?: string; // CSS width (e.g., "w-6", "flex-1", "w-24")
  align?: "left" | "center" | "right";
  type?: "boolean" | "text" | "readonly"; // Input type for the column
  editable?: boolean; // Can the user edit this field inline
  icon?: {
    active: string; // Icon/text when true (e.g., "🔑", "✓")
    inactive: string; // Icon/text when false (e.g., "○", "")
  };
  color?: {
    active?: string; // CSS color when active (e.g., "text-yellow-600")
    inactive?: string; // CSS color when inactive
  };
};

export type NodeRenderConfig = {
  shape: "rectangle" | "diamond" | "ellipse" | "table" | "note";
  sections?: NodeSection[];
  columns?: TableColumn[]; // Column definitions for table nodes
  minWidth?: number;
  minHeight?: number;
  borderStyle?: "solid" | "dashed" | "double";
  borderWidth?: number;
};

export type CanvasComponent = {
  id: string;
  icon?: React.ComponentType;
  label: string;
  description?: string;
  group?: string;
  tags?: string[];
  properties?: ComponentProperty[];
  nodeType?: "custom" | "erNode" | "group" | "tableNode"; // Specify which node component to use
  renderConfig?: NodeRenderConfig; // Visual configuration for the node
  data?: Record<string, unknown>; // Default data for the node (e.g., attributes for table nodes)
};
