export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'segmented' | 'chips';

export interface ToolFieldOption {
  value: string;
  label: string;
  icon?: string;
}

export interface ToolField {
  key: string;
  label?: string;
  type: FieldType;
  placeholder?: string;
  icon?: string;
  hint?: string;
  rows?: number;
  counter?: boolean;
  options?: ToolFieldOption[];
  visible?: (values: Record<string, unknown>) => boolean;
  defaultValue?: unknown;
}

export interface QrBuildResult {
  data: string;
  label: string;
  snippet: string;
  notice?: string;
}

export interface ToolConfig {
  id: string;
  title: string;
  sub: string;
  icon: string;
  fields: ToolField[];
  build: (values: Record<string, unknown>) => QrBuildResult;
}

export interface ToolGroup {
  title: string;
  items: { id: string; icon: string; label: string }[];
}
