import React, { useState, useEffect, useRef } from 'react';

interface InputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  type?: 'text' | 'textarea';
  required?: boolean;
}

export const InputDialog: React.FC<InputDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  label,
  placeholder,
  defaultValue = '',
  type = 'text',
  required = false,
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      // Focus the input when dialog opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (required && !value.trim()) {
      return;
    }
    onConfirm(value);
    // Don't auto-close - let parent component control this
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        className="bg-surface rounded-lg shadow-xl border border-theme/10 w-full max-w-md mx-4"
        role="dialog"
        aria-labelledby="dialog-title"
        aria-modal="true"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-theme/10">
            <h2 id="dialog-title" className="text-lg font-semibold text-theme">
              {title}
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <label htmlFor="dialog-input" className="block text-sm font-medium text-theme mb-2">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {type === 'textarea' ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                id="dialog-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-theme/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 bg-theme text-theme resize-none"
                rows={4}
                required={required}
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                id="dialog-input"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-theme/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 bg-theme text-theme"
                required={required}
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-theme/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-theme hover:bg-[var(--bg-hover)] rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={required && !value.trim()}
              className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-md hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
