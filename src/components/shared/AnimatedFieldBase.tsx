import React from 'react';
import { motion } from 'motion/react';

interface FieldWrapperProps {
  label?: string;
  id: string;
  focused: boolean;
  containerClassName?: string;
  children: React.ReactNode;
}

export const FieldWrapper: React.FC<FieldWrapperProps> = ({ label, id, children, focused, containerClassName }) => {
  const labelElementId = `${id}-label`;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className={`flex flex-col gap-1 ${containerClassName || ''}`}
    >
      {label && (
        <motion.label
          id={labelElementId}
            htmlFor={id}
            className="text-xs text-muted"
            animate={{ color: focused ? 'var(--brand)' : 'var(--muted)' }}
            transition={{ duration: 0.25 }}
        >
          {label}
        </motion.label>
      )}
      {children}
    </motion.div>
  );
};
