import React from 'react';
import { motion } from 'motion/react';
import { FieldWrapper } from './AnimatedFieldBase';
import { useFocus } from './useFocus';

export interface AnimatedTextareaProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

const AnimatedTextarea: React.FC<AnimatedTextareaProps> = ({ id, label, value, onChange, placeholder, rows = 6, disabled, className='', containerClassName }) => {
  const { focused, onFocus, onBlur } = useFocus();
  return (
    <FieldWrapper id={id} label={label} focused={focused} containerClassName={containerClassName}>
      <motion.textarea
        id={id}
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        className={`w-full border p-1 px-2 rounded bg-[var(--surface)] text-theme resize-y outline-none ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
        animate={{ boxShadow: focused ? '0 0 0 2px var(--brand)' : '0 0 0 1px var(--border)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    </FieldWrapper>
  );
};

export default AnimatedTextarea;
