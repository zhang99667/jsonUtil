import React from 'react';

export enum TransformMode {
  NONE = 'NONE',
  FORMAT = 'FORMAT',
  DEEP_FORMAT = 'DEEP_FORMAT',
  MINIFY = 'MINIFY',
  ESCAPE = 'ESCAPE',
  UNESCAPE = 'UNESCAPE',
  UNICODE_TO_CN = 'UNICODE_TO_CN',
  CN_TO_UNICODE = 'CN_TO_UNICODE'
}

export enum ActionType {
  AI_FIX = 'AI_FIX',
  SAVE = 'SAVE',
  OPEN = 'OPEN',
  NEW_TAB = 'NEW_TAB'
}

export enum AIProvider {
  GEMINI = 'gemini',
  OPENAI = 'openai',
  QWEN = 'qwen',
  ERNIE = 'ernie',
  GLM = 'glm',
  DEEPSEEK = 'deepseek',
  CUSTOM = 'custom'
}

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ShortcutKey {
  key: string;
  meta: boolean; // Meta 键 (Mac: Cmd, Win: Win)
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
}

export type ShortcutAction = 'SAVE' | 'FORMAT' | 'DEEP_FORMAT' | 'MINIFY' | 'CLOSE_TAB' | 'TOGGLE_JSONPATH' | 'NEW_TAB';

export type ShortcutConfig = Record<ShortcutAction, ShortcutKey>;

export interface FileTab {
  id: string;
  name: string;
  content: string;
  handle?: any; // FileSystemFileHandle
  isDirty?: boolean;
  mode?: TransformMode; // 保存每个标签的转换模式
}

export interface HighlightRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  language?: string;
  placeholder?: string;
  label: string;
  error?: string;
  canToggleReadOnly?: boolean;
  headerActions?: React.ReactNode;
  files?: FileTab[];
  activeFileId?: string | null;
  onTabClick?: (id: string) => void;
  onCloseFile?: (id: string) => void;
  onNewTab?: () => void;
  highlightRange?: HighlightRange | null;
  onFocus?: () => void;
}
