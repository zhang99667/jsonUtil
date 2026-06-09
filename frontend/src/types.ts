import React from 'react';

// ============ JSON 值类型 ============

/**
 * JSON 基本值类型（递归定义）
 * 用于替代 JSON.parse 返回值中的 any
 */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/**
 * JSON 对象类型
 */
export type JsonObject = { [key: string]: JsonValue };

/**
 * JSON 数组类型
 */
export type JsonArray = JsonValue[];

// ============ 管理后台表单类型 ============

/** 登录表单字段 */
export interface LoginFormValues {
  username: string;
  password: string;
}

/** 添加用户表单字段 */
export interface AddUserFormValues {
  email: string;
  password: string;
  role: 'USER' | 'ADMIN';
}

/** JWT 解码结果 */
export interface JwtDecodeResult {
  header: JsonObject;
  payload: JsonObject;
  signature: string;
}

export enum TransformMode {
  NONE = 'NONE',
  FORMAT = 'FORMAT',
  DEEP_FORMAT = 'DEEP_FORMAT',
  MINIFY = 'MINIFY',
  ESCAPE = 'ESCAPE',
  UNESCAPE = 'UNESCAPE',
  UNICODE_TO_CN = 'UNICODE_TO_CN',
  CN_TO_UNICODE = 'CN_TO_UNICODE',
  URL_ENCODE = 'URL_ENCODE',
  URL_DECODE = 'URL_DECODE',
  BASE64_ENCODE = 'BASE64_ENCODE',
  BASE64_DECODE = 'BASE64_DECODE',
  SORT_KEYS = 'SORT_KEYS'
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

export interface GeneralSettings {
  autoExpandSchemeInDeepFormat: boolean;
}

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  autoExpandSchemeInDeepFormat: false,
};

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
  | 'scheme_decode'   // CMD/Scheme 参数串展开
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
  originalScheme?: string;    // 原始 CMD/Scheme 字符串
  originalSchemeType?: 'query-string' | 'url' | 'base64'; // 当前支持独立 CMD、URL Scheme 和 Base64 JSON 展开
  originalSchemeReversible?: boolean; // 当前编码层是否支持安全反向还原
  decodedSchemeValue?: JsonValue; // 原始串对应的展开结果，用于无编辑时精确还原
}

// 单个路径的转换记录
export interface PathTransformRecord {
  path: string;              // JSON Path, 如 "$.data" 或 "$.users[0].config"
  steps: TransformStep[];    // 该路径上发生的转换序列（正向顺序）
  originalValue: string;     // 原始字符串值（用于校验）
}

export interface TransformWarning {
  type: 'string_decode_skipped';
  path: string;
  message: string;
  length: number;
  limit: number;
}

// 整个转换的上下文
export interface TransformContext {
  mode: TransformMode;
  records: Map<string, PathTransformRecord>;  // path -> record
  timestamp: number;
  originalIndentation: number | string;  // 原始缩进（用于还原格式）
  sourceFormat?: 'json' | 'jsonl';  // 根输入格式，用于 JSONL 深度格式化后回写
  warnings?: TransformWarning[]; // 本次转换中为保护性能而跳过的内容
}

// 转换结果（带上下文）
export interface TransformResult {
  output: string;            // 转换后的 JSON 字符串
  context: TransformContext; // 转换上下文（用于反向还原）
}

// ============ 模板填充配置 ============

export interface TemplateFillConfig {
  template: string;
  lastUpdated: number;
}

// ============ 文件标签 ============

export interface FileTab {
  id: string;
  name: string;
  content: string;
  savedContent?: string; // 磁盘上的已保存内容（用于 Diff 对比）
  handle?: FileSystemFileHandle; // File System Access API 的文件句柄
  isDirty?: boolean;
  mode?: TransformMode; // 保存每个标签的转换模式
  path?: string; // 文件完整路径
  transformContext?: TransformContext; // 该 Tab 的转换上下文（避免窜台）
  viewState?: unknown; // Monaco Editor 的视图状态（光标位置、滚动位置等）
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
  warning?: string;
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
  onSaveViewState?: (fileId: string, viewState: unknown) => void; // 保存标签页的编辑器视图状态
  restoreViewState?: unknown; // 切换标签页时需要恢复的视图状态
}
