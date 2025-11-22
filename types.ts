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
  OPEN = 'OPEN'
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ShortcutKey {
  key: string;
  meta: boolean; // Cmd on Mac, Win on Windows
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
}

export type ShortcutAction = 'SAVE' | 'FORMAT' | 'DEEP_FORMAT' | 'MINIFY';

export type ShortcutConfig = Record<ShortcutAction, ShortcutKey>;

export interface FileTab {
  id: string;
  name: string;
  content: string;
  handle?: any; // FileSystemFileHandle
  isDirty?: boolean;
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
}
