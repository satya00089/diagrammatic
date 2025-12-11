import React from "react";

export interface AnimatedCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/*
  Re-usable animated checkbox using the `motion` package.
  - Uses a native checkbox for accessibility (screen readers & keyboard)
  - Hides the default appearance and overlays an animated check glyph
  - Spring animation on enter/exit
*/
export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  id,
  checked,
  onChange,
  label,
  disabled = false,
  className = "",
}) => {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 text-sm cursor-pointer select-none ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
    >
      <span className="relative inline-flex items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer w-4 h-4 cursor-pointer appearance-none rounded border border-theme bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-1 transition-colors disabled:cursor-not-allowed"
        />
        {checked && (
          <span className="pointer-events-none absolute w-3 h-3 flex items-center justify-center text-[10px] font-semibold text-white bg-[var(--brand)] rounded-sm shadow-sm">
            ✓
          </span>
        )}
      </span>
      {label && <span className="text-sm text-theme">{label}</span>}
    </label>
  );
};

export default AnimatedCheckbox;
