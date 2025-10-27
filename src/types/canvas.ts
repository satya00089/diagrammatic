export type ComponentProperty = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select';
  default?: string | number | boolean;
  placeholder?: string;
  options?: string[];
};

export type CanvasComponent = {
  id: string;
  icon?: string;
  label: string;
  description?: string;
  group?: string;
  properties?: ComponentProperty[];
};
