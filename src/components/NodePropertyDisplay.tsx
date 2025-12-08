import React from "react";
import DOMPurify from "dompurify";
import type { PropertyValue } from "../types/canvas";

interface NodePropertyDisplayProps {
  propertyKey: string;
  value: PropertyValue;
}

const NodePropertyDisplay: React.FC<NodePropertyDisplayProps> = ({
  propertyKey,
  value,
}) => {
  // Helper to render value based on type
  const renderValue = (val: PropertyValue): React.ReactNode => {
    // Handle null/undefined
    if (val === null || val === undefined) {
      return <span className="text-muted italic">empty</span>;
    }

    // Handle React Component
    if (typeof val === "function") {
      return <span className="text-purple-500 italic">[Component]</span>;
    }

    // Handle boolean
    if (typeof val === "boolean") {
      return (
        <span className={val ? "text-green-500" : "text-red-500"}>
          {val ? "✓ true" : "✗ false"}
        </span>
      );
    }

    // Handle number
    if (typeof val === "number") {
      return <span className="font-mono text-blue-500">{val}</span>;
    }

    // Handle array
    if (Array.isArray(val)) {
      if (val.length === 0) {
        return <span className="text-muted italic">[ ]</span>;
      }
      return (
        <div className="flex flex-col gap-1">
          {val.map((item, idx) => (
            <div key={idx} className="ml-2 text-muted">
              • {String(item)}
            </div>
          ))}
        </div>
      );
    }

    // Handle object
    if (typeof val === "object" && val !== null) {
      return (
        <div className="flex flex-col gap-1">
          {Object.entries(val).map(([key, value]) => (
            <div key={key} className="ml-2 text-muted">
              <span className="font-semibold">{key}:</span> {String(value)}
            </div>
          ))}
        </div>
      );
    }

    // Handle HTML string
    const strVal = String(val);
    if (strVal.includes("<") && strVal.includes(">")) {
      const sanitized = DOMPurify.sanitize(strVal, {
        ALLOWED_TAGS: [
          "p",
          "br",
          "strong",
          "em",
          "u",
          "ol",
          "ul",
          "li",
          "a",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
        ],
        ALLOWED_ATTR: ["href", "target", "class"],
      });

      // Strip HTML for checking if empty
      const textOnly = sanitized
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (textOnly.length === 0) {
        return <span className="text-muted italic">empty</span>;
      }

      return (
        <div
          className="prose prose-sm max-w-none text-theme [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      );
    }

    // Handle regular string
    if (strVal.length === 0) {
      return <span className="text-muted italic">empty</span>;
    }

    return <span className="break-words">{strVal}</span>;
  };

  return (
    <div className="flex flex-col gap-1 p-2 rounded bg-[var(--bg-hover)]/30">
      <div
        className="text-muted font-semibold uppercase tracking-wide"
        style={{ fontSize: "0.65rem" }}
      >
        {propertyKey}
      </div>
      <div className="text-theme max-h-32 overflow-y-auto node-properties-scroll">
        {renderValue(value)}
      </div>
    </div>
  );
};

export default NodePropertyDisplay;
