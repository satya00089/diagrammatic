export type ComponentProperty = {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  default?: string | number | boolean;
  options?: string[]; // for select type
};

export type CanvasComponent = {
  id: string;
  icon?: string;
  label: string;
  description?: string;
  properties?: ComponentProperty[];
};
