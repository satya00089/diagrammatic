import React from 'react';
import { motion } from 'motion/react';
import { FieldWrapper } from './AnimatedFieldBase';
import { useFocus } from './useFocus';

export interface AnimatedTextInputProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

const AnimatedTextInput: React.FC<AnimatedTextInputProps> = ({ id, label, value, onChange, placeholder, disabled, className='', containerClassName }) => {
  const { focused, onFocus, onBlur } = useFocus();
  return (
    <FieldWrapper id={id} label={label} focused={focused} containerClassName={containerClassName}>
      <motion.input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        className={`w-full border p-1 px-2 rounded bg-[var(--surface)] text-theme outline-none ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
        animate={{ boxShadow: focused ? '0 0 0 2px var(--brand)' : '0 0 0 1px var(--border)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    </FieldWrapper>
  );
};

export default AnimatedTextInput;
