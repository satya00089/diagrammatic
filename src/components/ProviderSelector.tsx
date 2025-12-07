/**
 * Generic Provider Selector Component with Search
 * Works for cloud providers, frameworks, design patterns, etc.
 */

import React from 'react';
import { SiAmazon, SiMicrosoftazure, SiGooglecloud, SiKubernetes, SiDocker, SiTerraform } from 'react-icons/si';
import { MdApps } from 'react-icons/md';
import { BiCategory, BiSearch } from 'react-icons/bi';

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
  enableSearch?: boolean;
}

// Default provider configurations with icons
export const DEFAULT_PROVIDERS: ProviderOption[] = [
  { id: 'all', name: 'All Providers', icon: MdApps, color: '#6B7280' },
  { id: 'AWS', name: 'AWS', icon: SiAmazon, color: '#FF9900' },
  { id: 'Azure', name: 'Azure', icon: SiMicrosoftazure, color: '#0078D4' },
  { id: 'GCP', name: 'Google Cloud', icon: SiGooglecloud, color: '#4285F4' },
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
  enableSearch = true,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Filter providers based on search query
  const filteredProviders = React.useMemo(() => {
    if (!searchQuery.trim()) return providers;
    
    const query = searchQuery.toLowerCase();
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query)
    );
  }, [providers, searchQuery]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen && enableSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, enableSearch]);

  const selectedOption = providers.find(p => p.id === selectedProvider);

  const handleProviderSelect = (providerId: string) => {
    onProviderChange(providerId);
    setIsOpen(false);
    setSearchQuery('');
  };

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
        <div className="absolute z-50 mt-1 w-full max-w-[200px] bg-[var(--surface)] border border-theme rounded shadow-lg max-h-80 overflow-hidden flex flex-col">
          {/* Search Input */}
          {enableSearch && (
            <div className="p-2 border-b border-theme">
              <div className="relative">
                <BiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-muted" size={14} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search providers..."
                  className="w-full pl-7 pr-2 py-1 text-xs border border-theme rounded bg-[var(--bg)] text-theme placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                />
              </div>
            </div>
          )}

          {/* Provider List */}
          <div className="overflow-y-auto max-h-60">
            {filteredProviders.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted">
                No providers found
              </div>
            ) : (
              filteredProviders.map((provider) => {
                const isSelected = selectedProvider === provider.id;
                const Icon = provider.icon;
                
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => handleProviderSelect(provider.id)}
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
              })
            )}
          </div>
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
