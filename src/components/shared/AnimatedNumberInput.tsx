import React from "react";
import { motion } from "motion/react";
import { FieldWrapper } from "./AnimatedFieldBase";
import { useFocus } from "./useFocus";

export interface AnimatedNumberInputProps {
  id: string;
  label?: string;
  value: number | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number | "any";
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

const AnimatedNumberInput: React.FC<AnimatedNumberInputProps> = ({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  disabled,
  className = "",
  containerClassName,
}) => {
  const { focused, onFocus, onBlur } = useFocus();
  return (
    <FieldWrapper
      id={id}
      label={label}
      focused={focused}
      containerClassName={containerClassName}
    >
      <motion.input
        id={id}
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`w-full border p-1 px-2 rounded bg-[var(--surface)] text-theme outline-none ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
        animate={{
          boxShadow: focused
            ? "0 0 0 2px var(--brand)"
            : "0 0 0 1px var(--border)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    </FieldWrapper>
  );
};

export default AnimatedNumberInput;
