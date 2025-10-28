import React, { useState } from "react";
import { MdDelete, MdExpandMore, MdExpandLess } from "react-icons/md";
import AnimatedTextInput from "./shared/AnimatedTextInput";
import AnimatedNumberInput from "./shared/AnimatedNumberInput";
import AnimatedCheckbox from "./shared/AnimatedCheckbox";
import AnimatedSelect from "./shared/AnimatedSelect";
import AnimatedTextarea from "./shared/AnimatedTextarea";

export type CustomProperty = {
  id: string;
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "boolean";
  value: string | number | boolean;
};

type CustomPropertyInputProps = {
  property: CustomProperty;
  onUpdate: (id: string, updates: Partial<CustomProperty>) => void;
  onDelete: (id: string) => void;
  isNew?: boolean;
};

export const CustomPropertyInput: React.FC<CustomPropertyInputProps> = ({
  property,
  onUpdate,
  onDelete,
  isNew = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(isNew);

  const handleValueChange = (value: string | number | boolean) => {
    onUpdate(property.id, { value });
  };

  const handleConfigChange = (
    field: keyof CustomProperty,
    value: string | number | boolean,
  ) => {
    onUpdate(property.id, { [field]: value });
  };

  const typeOptions = [
    { value: "text", label: "Text" },
    { value: "textarea", label: "Text Area" },
    { value: "number", label: "Number" },
    { value: "boolean", label: "Checkbox" },
  ];

  return (
    <div className="border border-theme rounded-lg overflow-hidden bg-[var(--bg-hover)]/30">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-[var(--bg-hover)]/50">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 flex-1 text-left hover:text-[var(--brand)] transition-colors"
        >
          {isExpanded ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
          <span className="text-sm font-medium text-theme truncate">
            {property.label || "Unnamed Property"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onDelete(property.id)}
          className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors"
          title="Delete custom property"
        >
          <MdDelete size={16} />
        </button>
      </div>

      {/* Configuration Panel (when expanded) */}
      {isExpanded && (
        <div className="p-3 space-y-3 border-t border-theme">
          <div className="grid grid-cols-2 gap-2">
            <AnimatedTextInput
              id={`${property.id}-key`}
              label="Key"
              value={property.key}
              onChange={(val: string) => handleConfigChange("key", val)}
              placeholder="e.g., customField"
            />
            <AnimatedTextInput
              id={`${property.id}-label`}
              label="Label"
              value={property.label}
              onChange={(val: string) => handleConfigChange("label", val)}
              placeholder="e.g., Custom Field"
            />
          </div>

          <AnimatedSelect
            id={`${property.id}-type`}
            label="Type"
            value={property.type}
            options={typeOptions.map((opt) => opt.value)}
            onChange={(val: string) => {
              handleConfigChange("type", val);
              // Reset value when type changes
              if (val === "boolean") {
                handleConfigChange("value", false);
              } else if (val === "number") {
                handleConfigChange("value", 0);
              } else {
                handleConfigChange("value", "");
              }
            }}
          />

          {/* Divider */}
          <div className="border-t border-theme pt-3">
            <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
              Current Value
            </div>

            {/* Value Input based on type */}
            {property.type === "text" && (
              <AnimatedTextInput
                id={`${property.id}-value`}
                label=""
                value={String(property.value)}
                onChange={handleValueChange}
                placeholder="Enter value"
              />
            )}

            {property.type === "textarea" && (
              <AnimatedTextarea
                id={`${property.id}-value`}
                label=""
                value={String(property.value)}
                onChange={handleValueChange}
                placeholder="Enter value"
              />
            )}

            {property.type === "number" && (
              <AnimatedNumberInput
                id={`${property.id}-value`}
                label=""
                value={Number(property.value) || 0}
                onChange={(val: number) => handleValueChange(val)}
              />
            )}

            {property.type === "boolean" && (
              <div className="pt-1">
                <AnimatedCheckbox
                  id={`${property.id}-value`}
                  checked={Boolean(property.value)}
                  onChange={handleValueChange}
                  label="Enabled"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomPropertyInput;
