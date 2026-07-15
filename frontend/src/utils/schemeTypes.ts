import type { SchemeJsonPayloadValue } from './schemeJsonPayloadTypes';
import type { SchemeDecodeWarning } from './schemeStructuredDecodeTypes';
import type { SchemeUrlInfo } from './schemeUrlInfo';

export type { SchemeDecodeWarning } from './schemeStructuredDecodeTypes';

export type SchemeType =
  | 'url'           // 带协议的 URL（例如 https://、myapp://）
  | 'query-string'  // 查询参数串 (key=value&key=value...)
  | 'url-encoded'   // URL 编码的内容
  | 'base64'        // Base64 编码
  | 'jwt'           // JWT 令牌
  | 'json'          // JSON 字符串
  | 'plain';        // 普通字符串

type DecodeLayerType = SchemeType | 'json-escaped-slash' | 'json-unicode-ascii';

export interface DecodeLayer {
  type: DecodeLayerType;
  before: string;     // 解码前的内容
  after?: string;     // 解码后的内容，用于面板展示每层转换证据
  description: string; // 描述，如“URL 解码”、“Base64 解码”
  reversible?: boolean; // 是否可按原格式重新编码
}

export interface SchemeParamDecodeStage {
  path: string;        // 参数在解码结果中的路径
  key: string;         // 解码后的参数名
  source: 'query' | 'hash' | 'fragment' | 'log-field' | 'prefixed-query'; // 参数来源
  raw: string;         // URL 解码前的原始参数值
  urlDecoded: string;  // URL 解码后的参数值
  parsed: string;      // 继续递归解析后的展示文本
  repairHint?: string; // 宽松 JSON 等兜底修复说明
  reencoded: string;   // 按当前解析值重新 URL 编码后的预览
  reversible: boolean; // 是否可以按普通查询参数重新编码
}

export interface SchemePlaceholder {
  path: string;        // 占位符所在路径
  value: string;       // 占位符原值
  description: string; // 占位符说明
}

export interface SchemePlaceholderGroup {
  value: string;       // 占位符原值
  description: string; // 占位符说明
  count: number;       // 出现次数
  paths: string[];     // 出现路径
}

export interface SchemeDecodeResult {
  original: string;           // 原始字符串
  decoded: string;            // 最终解码结果
  layers: DecodeLayer[];      // 解码层级
  isJson: boolean;            // 最终结果是否为有效 JSON
  placeholders?: SchemePlaceholder[]; // 运行时占位符
  warnings?: SchemeDecodeWarning[]; // 解析过程中的性能护栏提示
  paramStages?: SchemeParamDecodeStage[]; // 查询参数分层解析证据
  schemeInfo?: SchemeUrlInfo; // Scheme 信息（如果是 URL）
}

export type StructuredValue = SchemeJsonPayloadValue;

export const DEFAULT_SCHEME_DECODE_MAX_DEPTH = 15;
