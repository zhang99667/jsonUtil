
export enum TransformMode {
  NONE = 'NONE',
  FORMAT = 'FORMAT',
  MINIFY = 'MINIFY',
  ESCAPE = 'ESCAPE',
  UNESCAPE = 'UNESCAPE',
  UNICODE_TO_CN = 'UNICODE_TO_CN',
  CN_TO_UNICODE = 'CN_TO_UNICODE'
}

export enum ActionType {
  AI_FIX = 'AI_FIX'
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  canToggleReadOnly?: boolean;
  placeholder?: string;
  label: string;
  error?: string;
}
