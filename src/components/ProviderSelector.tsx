/**
 * Provider types and default configurations
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
