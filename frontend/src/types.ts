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
  NEW_TAB = 'NEW_TAB',
  STATISTICS = 'STATISTICS'
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

// ============ 转换路径记录机制 ============

// 单步转换操作类型
export type TransformStepType =
  | 'json_parse'      // JSON.parse
  | 'json_stringify'  // JSON.stringify
  | 'unicode_decode'  // \uXXXX → 中文
  | 'unicode_encode'  // 中文 → \uXXXX
  | 'url_decode'      // URL 解码
  | 'url_encode'      // URL 编码
  | 'base64_decode'   // Base64 解码
  | 'base64_encode'   // Base64 编码
  | 'unescape'        // 反转义
  | 'escape';         // 转义

// 单步转换操作
export interface TransformStep {
  type: TransformStepType;
  // 可选：保存原始细节用于精确还原
  originalEncoding?: string;  // 如 'utf-8'
  originalPadding?: boolean;  // Base64 是否有 padding
}

// 单个路径的转换记录
export interface PathTransformRecord {
  path: string;              // JSON Path, 如 "$.data" 或 "$.users[0].config"
  steps: TransformStep[];    // 该路径上发生的转换序列（正向顺序）
  originalValue: string;     // 原始字符串值（用于校验）
}

// 整个转换的上下文
export interface TransformContext {
  mode: TransformMode;
  records: Map<string, PathTransformRecord>;  // path -> record
  timestamp: number;
  originalIndentation: number | string;  // 原始缩进（用于还原格式）
}

// 转换结果（带上下文）
export interface TransformResult {
  output: string;            // 转换后的 JSON 字符串
  context: TransformContext; // 转换上下文（用于反向还原）
}

// ============ 文件标签 ============

export interface FileTab {
  id: string;
  name: string;
  content: string;
  savedContent?: string; // 磁盘上的已保存内容（用于 Diff 对比）
  handle?: any; // FileSystemFileHandle
  isDirty?: boolean;
  mode?: TransformMode; // 保存每个标签的转换模式
  path?: string; // 文件完整路径
  transformContext?: TransformContext; // 该 Tab 的转换上下文（避免窜台）
}

export interface HighlightRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface EditorProps {
  value: string;
  originalValue?: string; // 原始值（用于 Diff 对比）
  path?: string; // 文件的唯一路径（用于隔离 Monaco Model 和撤销栈）
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
  onCursorPositionChange?: (line: number, column: number) => void;
}
