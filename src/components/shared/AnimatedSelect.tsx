import React from "react";
import { motion } from "motion/react";
import { FieldWrapper } from "./AnimatedFieldBase";
import { useFocus } from "./useFocus";

export interface AnimatedSelectProps {
  id: string;
  label?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

const AnimatedSelect: React.FC<AnimatedSelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
  className = "",
  containerClassName,
}) => {
  const { focused, onFocus, onBlur } = useFocus();
  const labelId = `${id}-label`;
  return (
    <FieldWrapper
      id={id}
      label={label}
      focused={focused}
      containerClassName={containerClassName}
    >
      {!label && (
        <label id={labelId} htmlFor={id} className="sr-only">
          {id}
        </label>
      )}
      <motion.div
        initial={{ opacity: 0, y: -4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="w-full"
      >
        <select
          id={id}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          aria-labelledby={label ? labelId : undefined}
          aria-label={label || id}
          title={label || id}
          className={`w-full border p-1 px-2 rounded bg-[var(--surface)] text-theme outline-none ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </motion.div>
    </FieldWrapper>
  );
};

export default AnimatedSelect;
