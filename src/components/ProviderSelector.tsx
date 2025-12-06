/**
 * Generic Provider Selector Component
 * Works for cloud providers, frameworks, design patterns, etc.
 */

import React from 'react';
import { SiAmazon, SiMicrosoftazure, SiGooglecloud, SiKubernetes, SiDocker, SiTerraform } from 'react-icons/si';
import { MdApps } from 'react-icons/md';
import { BiCategory } from 'react-icons/bi';

export type ProviderOption = {
  id: string;
  name: string;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color?: string;
};

interface ProviderSelectorProps {
  providers: ProviderOption[];
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  label?: string;
  placeholder?: string;
}

// Default provider configurations with icons
export const DEFAULT_PROVIDERS: ProviderOption[] = [
  { id: 'all', name: 'All Providers', icon: MdApps, color: '#6B7280' },
  { id: 'aws', name: 'AWS', icon: SiAmazon, color: '#FF9900' },
  { id: 'azure', name: 'Azure', icon: SiMicrosoftazure, color: '#0078D4' },
  { id: 'gcp', name: 'Google Cloud', icon: SiGooglecloud, color: '#4285F4' },
  { id: 'kubernetes', name: 'Kubernetes', icon: SiKubernetes, color: '#326CE5' },
  { id: 'docker', name: 'Docker', icon: SiDocker, color: '#2496ED' },
  { id: 'terraform', name: 'Terraform', icon: SiTerraform, color: '#7B42BC' },
  { id: 'generic', name: 'Generic', icon: BiCategory, color: '#8B5CF6' },
];

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  providers,
  selectedProvider,
  onProviderChange,
  label = 'Provider',
  placeholder = 'Select provider',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const selectedOption = providers.find(p => p.id === selectedProvider);

  return (
    <div className="mb-3" ref={dropdownRef}>
      <label className="block text-xs font-medium text-muted mb-1.5">
        {label}
      </label>
      
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm border border-theme rounded bg-[var(--bg)] text-theme hover:bg-[var(--bg-hover)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon && (
            <selectedOption.icon 
              size={16} 
              style={{ color: selectedOption.color }}
            />
          )}
          <span>{selectedOption?.name || placeholder}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-w-[200px] bg-[var(--surface)] border border-theme rounded shadow-lg max-h-60 overflow-y-auto">
          {providers.map((provider) => {
            const isSelected = selectedProvider === provider.id;
            const Icon = provider.icon;
            
            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => {
                  onProviderChange(provider.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors
                  ${isSelected 
                    ? 'bg-[var(--brand)]/10 text-[var(--brand)]' 
                    : 'text-theme hover:bg-[var(--bg-hover)]'
                  }
                `}
              >
                {Icon && (
                  <Icon 
                    size={16} 
                    style={{ color: isSelected ? provider.color : undefined }}
                  />
                )}
                <span className="font-medium">{provider.name}</span>
                {isSelected && (
                  <svg className="ml-auto w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Simple Grid Layout Version (for smaller provider lists)
 */
export const ProviderSelectorGrid: React.FC<ProviderSelectorProps> = ({
  providers,
  selectedProvider,
  onProviderChange,
  label = 'Provider',
}) => {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-muted mb-1.5">
        {label}
      </label>
      <div className="grid grid-cols-2 gap-1.5">
        {providers.map((provider) => {
          const isSelected = selectedProvider === provider.id;
          const Icon = provider.icon;
          
          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => onProviderChange(provider.id)}
              className={`
                flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded border transition-all
                ${isSelected 
                  ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]' 
                  : 'border-theme bg-surface text-theme hover:bg-[var(--bg-hover)]'
                }
              `}
              aria-pressed={isSelected}
            >
              {Icon && (
                <Icon 
                  size={14} 
                  style={{ color: isSelected ? provider.color : undefined }}
                />
              )}
              <span className="font-medium truncate">{provider.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
