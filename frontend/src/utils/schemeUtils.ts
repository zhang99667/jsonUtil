/**
 * Scheme 字符串检测和编解码工具
 * 支持 URL、Base64、JWT 等常见 scheme 的识别和解析
 */

// ============ 类型定义 ============

export type SchemeType = 
  | 'url'           // 带协议的 URL (https://, myapp://, etc.)
  | 'query-string'  // 查询参数串 (key=value&key=value...)
  | 'url-encoded'   // URL 编码的内容
  | 'base64'        // Base64 编码
  | 'jwt'           // JWT Token
  | 'json'          // JSON 字符串
  | 'plain';        // 普通字符串

export interface DecodeLayer {
  type: SchemeType;
  before: string;     // 解码前的内容
  description: string; // 描述，如 "URL Decode", "Base64 Decode"
}

export interface SchemeDecodeResult {
  original: string;           // 原始字符串
  decoded: string;            // 最终解码结果
  layers: DecodeLayer[];      // 解码层级
  isJson: boolean;            // 最终结果是否为有效 JSON
  schemeInfo?: {              // Scheme 信息（如果是 URL）
    protocol: string;         // 协议，如 "https:", "myapp:"
    host?: string;            // 主机
    path?: string;            // 路径
    hash?: string;            // URL hash 片段
    params?: Record<string, string | string[]>; // 原始查询参数
    hashParams?: Record<string, string | string[]>; // hash 内的参数
  };
}

type StructuredValue =
  | string
  | number
  | boolean
  | null
  | StructuredValue[]
  | { [key: string]: StructuredValue };

type QueryKeySegment = string | number | null;
type QueryParamContainer = { [key: string]: StructuredValue };

const COMMON_CMD_PARAM_NAMES = new Set([
  'cmd',
  'action_cmd',
  'actioncmd',
  'actioncommand',
  'action-command',
  'command',
  'cmd_param',
  'cmd_params',
  'command_param',
  'command_params',
  'schema',
  'schema_url',
  'schemaurl',
  'scheme',
  'scheme_url',
  'schemeurl',
  'url',
  'uri',
  'link',
  'target',
  'target_url',
  'jump_url',
  'landing_url',
  'h5_url',
  'page_url',
  'params',
  'param',
  'data',
  'payload',
  'ext',
  'extra',
  'callback',
  'callback_url',
  'open_url',
]);

const QUERY_KEY_PATTERN = '[A-Za-z0-9_.\\-[\\]%]+';
const QUERY_PAIR_START_RE = new RegExp(`^${QUERY_KEY_PATTERN}=`);
const QUERY_PAIR_DELIMITER_RE = new RegExp(`[&;](?=${QUERY_KEY_PATTERN}=)`);
const SEMICOLON_QUERY_DELIMITER_RE = new RegExp(`;(?=${QUERY_KEY_PATTERN}=)`, 'g');
const HTML_QUERY_DELIMITER_RE = new RegExp(`&(?:amp|#38);(?=${QUERY_KEY_PATTERN}=)`, 'g');

const normalizeQueryString = (source: string): string => (
  source.trim()
    .replace(HTML_QUERY_DELIMITER_RE, '&')
    .replace(SEMICOLON_QUERY_DELIMITER_RE, '&')
);

const stripQueryPrefix = (source: string): string => (
  source.trim().replace(/^\?/, '')
);

const looksLikeQueryString = (source: string): boolean => {
  const normalized = normalizeQueryString(stripQueryPrefix(source));
  return QUERY_PAIR_START_RE.test(normalized);
};

const looksLikeStructuredPayload = (value: string): boolean => (
  isJsonString(value) ||
  isUrl(value) ||
  hasUrlEncoding(value) ||
  isJwt(value) ||
  looksLikeQueryString(value)
);

const isStructuredBase64Value = (value: string): boolean => {
  const decoded = base64Decode(value);
  return decoded !== value && looksLikeStructuredPayload(decoded);
};

const isDecodableParamValue = (value: string): boolean => (
  hasUrlEncoding(value) ||
  isUrl(value) ||
  isJwt(value) ||
  isBase64(value) ||
  isJsonString(value) ||
  isStructuredBase64Value(value)
);

// ============ 检测函数 ============

/**
 * 检测字符串是否为 URL（包含协议）
 */
export function isUrl(str: string): boolean {
  // 匹配 scheme://... 格式
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/.+/.test(str.trim());
}

/**
 * 检测字符串是否为 URL 查询参数格式 (key=value&key=value...)
 * 这种格式不应该被识别为需要解析的 scheme
 */
export function isQueryStringFormat(str: string): boolean {
  const trimmed = str.trim();
  const source = normalizeQueryString(trimmed.startsWith('?') ? trimmed.slice(1) : trimmed);
  
  // 排除 URL 格式（真正的 scheme:// 不应被视为查询参数）
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return false;
  
  // 必须以 key= 开头（key 是有效的参数名格式）
  if (!QUERY_PAIR_START_RE.test(source)) return false;
  
  // 如果以 key= 开头且包含参数分隔符，认定为查询参数格式
  // 不再严格检查每部分的格式，因为部分值可能包含 URL 编码
  if (QUERY_PAIR_DELIMITER_RE.test(source)) {
    return true;
  }
  
  return false;
}

/**
 * 检测字符串是否像需要解析的 CMD 参数串
 * 单个 key=value 只有在 key 常见且 value 可继续解析时才命中，避免普通文本误判
 */
export function isDecodableQueryString(str: string): boolean {
  const trimmed = str.trim();
  const source = normalizeQueryString(trimmed.startsWith('?') ? trimmed.slice(1) : trimmed);

  if (!source || /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(source)) return false;
  if (!QUERY_PAIR_START_RE.test(source)) return false;

  if (QUERY_PAIR_DELIMITER_RE.test(source)) return true;

  const equalIndex = source.indexOf('=');
  const key = source.slice(0, equalIndex).toLowerCase();
  const value = source.slice(equalIndex + 1);
  return COMMON_CMD_PARAM_NAMES.has(key) && isDecodableParamValue(value);
}

/**
 * 检测字符串是否包含 URL 编码
 */
export function hasUrlEncoding(str: string): boolean {
  // 必须包含 %XX 格式的编码
  if (!/%[0-9A-Fa-f]{2}/.test(str)) return false;
  
  // 排除纯粹的查询参数格式（如 key=value&key=value）
  // 这种格式虽然可能包含 URL 编码，但不是我们要解析的 scheme
  if (isQueryStringFormat(str)) return false;
  
  return true;
}

/**
 * 检测字符串是否为有效的 Base64
 * 需要一定长度且符合 Base64 字符集
 */
export function isBase64(str: string): boolean {
  const trimmed = str.trim();
  // 长度至少 20，避免误判短字符串
  if (trimmed.length < 20) return false;
  
  // 排除 key=value 格式：Base64 的 = 只能作为末尾 padding
  // 如果 = 后面还有非 = 的字符，说明是 key=value 格式而非 Base64
  const equalSignIndex = trimmed.indexOf('=');
  if (equalSignIndex !== -1) {
    const afterEqual = trimmed.substring(equalSignIndex + 1);
    // 如果 = 后面有非 = 的字符，不是有效的 Base64
    if (afterEqual.length > 0 && !/^=*$/.test(afterEqual)) {
      return false;
    }
  }
  
  const decoded = base64Decode(trimmed);
  return decoded !== trimmed && decoded.length > 0 && isReadableDecodedText(decoded);
}

/**
 * 检测字符串是否为 JWT Token
 */
export function isJwt(str: string): boolean {
  const trimmed = str.trim();
  // JWT 格式: header.payload.signature
  const parts = trimmed.split('.');
  if (parts.length !== 3) return false;
  if (!parts.every(part => part && /^[A-Za-z0-9_-]+$/.test(part))) return false;

  // header/payload 必须能解成 JSON 对象，避免把版本号 1.2.3 误判成 JWT。
  return decodeJwt(trimmed) !== null;
}

/**
 * 检测字符串是否为 JSON
 */
export function isJsonString(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * 检测字符串的 scheme 类型
 */
export function detectSchemeType(str: string): SchemeType {
  if (!str || typeof str !== 'string') return 'plain';

  const trimmed = str.trim();

  // 优先级顺序很重要
  if (isJwt(trimmed)) return 'jwt';
  if (isUrl(trimmed)) return 'url';
  if (isDecodableQueryString(trimmed)) return 'query-string';
  if (hasUrlEncoding(trimmed)) return 'url-encoded';
  if (isBase64(trimmed)) return 'base64';
  if (isJsonString(trimmed)) return 'json';

  return 'plain';
}

/**
 * 检测字符串是否包含需要解析的 scheme
 */
export function hasScheme(str: string): boolean {
  const type = detectSchemeType(str);
  return type !== 'plain' && type !== 'json';
}

// ============ 解码函数 ============

/**
 * URL 解码
 */
export function urlDecode(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

/**
 * 查询参数解码，兼容表单编码中的 + 空格写法
 */
const decodeQueryComponent = (str: string): string => (
  urlDecode(str.replace(/\+/g, ' '))
);

/**
 * URL 编码
 */
export function urlEncode(str: string): string {
  return encodeURIComponent(str);
}

// ============ UTF-8 安全 Base64 工具 ============

const bytesToBinaryString = (bytes: Uint8Array): string => {
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return binary;
};

const binaryStringToBytes = (binary: string): Uint8Array => {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const normalizeBase64Input = (input: string): string | null => {
  const compact = input.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!compact || compact.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) {
    return null;
  }
  const firstPaddingIndex = compact.indexOf('=');
  if (firstPaddingIndex !== -1 && /[^=]/.test(compact.slice(firstPaddingIndex))) {
    return null;
  }
  const paddingLength = (4 - (compact.length % 4)) % 4;
  return compact + '='.repeat(paddingLength);
};

const isReadableDecodedText = (decoded: string): boolean => {
  if (!decoded.trim()) return false;
  const controlChars = decoded.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g);
  return !controlChars || controlChars.length / decoded.length < 0.05;
};

/**
 * Base64 解码
 */
export function base64Decode(str: string): string {
  const normalized = normalizeBase64Input(str);
  if (!normalized) return str;

  try {
    const bytes = binaryStringToBytes(atob(normalized));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return str;
  }
}

/**
 * Base64 编码
 */
export function base64Encode(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    return btoa(bytesToBinaryString(bytes));
  } catch {
    return str;
  }
}

/**
 * 解析 JWT Token
 */
export function decodeJwt(token: string): { header: Record<string, unknown>; payload: Record<string, unknown>; signature: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const header: unknown = JSON.parse(base64Decode(parts[0]));
    const payload: unknown = JSON.parse(base64Decode(parts[1]));
    if (!isRecord(header) || !isRecord(payload)) return null;
    
    return { header, payload, signature: parts[2] };
  } catch {
    return null;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const assignFlatQueryParam = (
  result: Record<string, string | string[]>,
  key: string,
  value: string
) => {
  const existing = result[key];
  if (existing === undefined) {
    result[key] = value;
  } else if (Array.isArray(existing)) {
    existing.push(value);
  } else {
    result[key] = [existing, value];
  }
};

const splitQueryPairs = (queryString: string): string[] => (
  normalizeQueryString(stripQueryPrefix(queryString)).split('&').filter(Boolean)
);

const parseFlatQueryParams = (queryString: string): Record<string, string | string[]> | undefined => {
  const params: Record<string, string | string[]> = {};

  splitQueryPairs(queryString).forEach(pair => {
    const equalIndex = pair.indexOf('=');
    if (equalIndex <= 0) return;

    const key = decodeQueryComponent(pair.slice(0, equalIndex));
    const value = decodeQueryComponent(pair.slice(equalIndex + 1));
    if (key) {
      assignFlatQueryParam(params, key, value);
    }
  });

  return Object.keys(params).length > 0 ? params : undefined;
};

const getFragmentParamSource = (hash: string): string | null => {
  const rawFragment = hash.replace(/^#/, '').trim();
  if (!rawFragment) return null;

  const candidates = [rawFragment];
  const decodedFragment = urlDecode(rawFragment);
  if (decodedFragment !== rawFragment) {
    candidates.push(decodedFragment);
  }

  for (const candidate of candidates) {
    const queryStart = candidate.startsWith('?') ? 1 : candidate.indexOf('?') + 1;
    const source = queryStart > 0 ? candidate.slice(queryStart) : candidate;
    const normalized = normalizeQueryString(source.replace(/^&/, ''));
    if (QUERY_PAIR_START_RE.test(normalized)) {
      return source;
    }
  }

  return null;
};

/**
 * 解析 URL，提取参数
 */
export function parseUrl(urlString: string): SchemeDecodeResult['schemeInfo'] | null {
  try {
    // 处理自定义 scheme（如 myapp://）
    const url = new URL(urlString);
    const params = parseFlatQueryParams(url.search);
    const fragmentParamSource = getFragmentParamSource(url.hash);
    const hashParams = fragmentParamSource ? parseFlatQueryParams(fragmentParamSource) : undefined;
    
    return {
      protocol: url.protocol,
      host: url.host || undefined,
      path: url.pathname || undefined,
      hash: url.hash ? url.hash.slice(1) : undefined,
      params,
      hashParams,
    };
  } catch {
    return null;
  }
}

const tryParseJson = (value: string): StructuredValue | null => {
  if (!isJsonString(value)) return null;
  try {
    return JSON.parse(value) as StructuredValue;
  } catch {
    return null;
  }
};

const tryParseJsonStringPayload = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    return typeof parsed === 'string' && looksLikeStructuredPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const decodeStructuredValue = (value: StructuredValue, maxDepth: number): StructuredValue => {
  if (maxDepth <= 0) return value;

  if (typeof value === 'string') {
    return decodeNestedParamValue(value, maxDepth - 1);
  }

  if (Array.isArray(value)) {
    return value.map(item => decodeStructuredValue(item, maxDepth - 1));
  }

  if (value && typeof value === 'object') {
    const result: { [key: string]: StructuredValue } = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = decodeStructuredValue(item, maxDepth - 1);
    }
    return result;
  }

  return value;
};

const parseStructuredQueryKey = (key: string): QueryKeySegment[] => {
  const segments: QueryKeySegment[] = [];
  let buffer = '';

  const pushBuffer = () => {
    if (buffer) {
      segments.push(buffer);
      buffer = '';
    }
  };

  for (let i = 0; i < key.length; i++) {
    const char = key[i];

    if (char === '.') {
      pushBuffer();
      continue;
    }

    if (char === '[') {
      const endIndex = key.indexOf(']', i + 1);
      if (endIndex === -1) {
        buffer += char;
        continue;
      }

      pushBuffer();
      const content = key.slice(i + 1, endIndex);
      if (content === '') {
        segments.push(null);
      } else if (/^\d+$/.test(content)) {
        segments.push(Number(content));
      } else {
        segments.push(content);
      }
      i = endIndex;
      continue;
    }

    buffer += char;
  }

  pushBuffer();
  return segments;
};

const createNestedContainer = (nextSegment: QueryKeySegment): StructuredValue => (
  typeof nextSegment === 'number' || nextSegment === null ? [] : {}
);

const mergeQueryValue = (existing: StructuredValue | undefined, value: StructuredValue): StructuredValue => {
  if (existing === undefined) {
    return value;
  } else if (Array.isArray(existing)) {
    return [...existing, value];
  }

  return [existing, value];
};

const assignQueryLeaf = (
  container: QueryParamContainer | StructuredValue[],
  segment: QueryKeySegment,
  value: StructuredValue
) => {
  if (segment === null) {
    if (Array.isArray(container)) {
      container.push(value);
    }
    return;
  }

  if (typeof segment === 'number') {
    if (Array.isArray(container)) {
      container[segment] = mergeQueryValue(container[segment], value);
    }
    return;
  }

  if (!Array.isArray(container)) {
    container[segment] = mergeQueryValue(container[segment], value);
  }
};

const assignStructuredQueryParam = (
  result: QueryParamContainer,
  segments: QueryKeySegment[],
  value: StructuredValue
) => {
  let current: QueryParamContainer | StructuredValue[] = result;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isLast = i === segments.length - 1;
    if (isLast) {
      assignQueryLeaf(current, segment, value);
      return;
    }

    const nextSegment = segments[i + 1];
    const nextContainer = createNestedContainer(nextSegment);

    if (segment === null) {
      if (!Array.isArray(current)) return;
      current.push(nextContainer);
      current = nextContainer as QueryParamContainer | StructuredValue[];
      continue;
    }

    if (typeof segment === 'number') {
      if (!Array.isArray(current)) return;
      const existing = current[segment];
      if (!existing || typeof existing !== 'object') {
        current[segment] = nextContainer;
      }
      current = current[segment] as QueryParamContainer | StructuredValue[];
      continue;
    }

    if (Array.isArray(current)) return;
    const existing = current[segment];
    if (!existing || typeof existing !== 'object') {
      current[segment] = nextContainer;
    }
    current = current[segment] as QueryParamContainer | StructuredValue[];
  }
};

const assignQueryParam = (
  result: QueryParamContainer,
  key: string,
  value: StructuredValue
) => {
  const shouldNestKey = key.includes('.') || key.includes('[');
  const segments = shouldNestKey ? parseStructuredQueryKey(key) : [];
  if (segments.length > 1) {
    assignStructuredQueryParam(result, segments, value);
    return;
  }

  result[key] = mergeQueryValue(result[key], value);
};

const parseQueryStringDeep = (queryString: string, maxDepth: number): StructuredValue | null => {
  const source = normalizeQueryString(stripQueryPrefix(queryString));
  if (!source || !isDecodableQueryString(source)) return null;

  return parseQueryPairsDeep(source, maxDepth);
};

const parseUrlQueryStringDeep = (queryString: string, maxDepth: number): StructuredValue | null => {
  const source = normalizeQueryString(stripQueryPrefix(queryString));
  if (!source || !QUERY_PAIR_START_RE.test(source)) return null;

  return parseQueryPairsDeep(source, maxDepth);
};

const parseQueryPairsDeep = (queryString: string, maxDepth: number): StructuredValue => {
  const result: QueryParamContainer = {};
  splitQueryPairs(queryString).forEach(pair => {
    const equalIndex = pair.indexOf('=');
    if (equalIndex <= 0) return;

    const key = decodeQueryComponent(pair.slice(0, equalIndex));
    const value = decodeQueryComponent(pair.slice(equalIndex + 1));
    if (!key) return;

    assignQueryParam(result, key, decodeNestedParamValue(value, maxDepth - 1));
  });
  return result as StructuredValue;
};

const mergeUrlDecodedParams = (
  queryParams: StructuredValue | null,
  hashParams: StructuredValue | null
): StructuredValue | null => {
  if (queryParams && hashParams && !Array.isArray(queryParams) && typeof queryParams === 'object') {
    return {
      ...queryParams,
      _hash: hashParams,
    } as StructuredValue;
  }

  return queryParams || hashParams;
};

const parseUrlParamsDeep = (urlString: string, maxDepth: number): StructuredValue | null => {
  try {
    const url = new URL(urlString);
    const queryParams = url.search ? parseUrlQueryStringDeep(url.search, maxDepth) : null;
    const fragmentParamSource = getFragmentParamSource(url.hash);
    const hashParams = fragmentParamSource ? parseUrlQueryStringDeep(fragmentParamSource, maxDepth) : null;

    return mergeUrlDecodedParams(queryParams, hashParams);
  } catch {
    return null;
  }
};

const decodeNestedParamValue = (value: string, maxDepth: number): StructuredValue => {
  if (maxDepth <= 0) return value;

  const jsonValue = tryParseJson(value);
  if (jsonValue !== null) {
    return decodeStructuredValue(jsonValue, maxDepth - 1);
  }

  const jsonStringPayload = tryParseJsonStringPayload(value);
  if (jsonStringPayload !== null) {
    return decodeNestedParamValue(jsonStringPayload, maxDepth);
  }

  const base64Value = decodeBase64StructuredParam(value, maxDepth - 1);
  if (base64Value !== null) {
    return base64Value;
  }

  const nested = deepDecodeScheme(value, maxDepth);
  if (nested.isJson) {
    const parsed = tryParseJson(nested.decoded);
    return parsed === null ? nested.decoded : decodeStructuredValue(parsed, maxDepth - 1);
  }

  return nested.layers.length > 0 ? nested.decoded : value;
};

const decodeBase64StructuredParam = (value: string, maxDepth: number): StructuredValue | null => {
  const decoded = base64Decode(value);
  if (decoded === value || !looksLikeStructuredPayload(decoded)) return null;

  return decodeNestedParamValue(decoded, maxDepth);
};

// ============ 递归解码 ============

/**
 * 递归解码 scheme 字符串，直到无法继续解码
 */
export function deepDecodeScheme(input: string, maxDepth: number = 5): SchemeDecodeResult {
  const layers: DecodeLayer[] = [];
  let current = input;
  let depth = 0;
  let schemeInfo: SchemeDecodeResult['schemeInfo'];

  while (depth < maxDepth) {
    const type = detectSchemeType(current);
    
    if (type === 'plain' || type === 'json') {
      break;
    }

    const before = current;

    switch (type) {
      case 'url': {
        // 解析 URL，提取 scheme 信息
        const urlInfo = parseUrl(current);
        if (urlInfo) {
          schemeInfo = urlInfo;
          
          // 如果有参数，将 query/hash 参数按 CMD 习惯逐项递归展开
          const decodedParams = parseUrlParamsDeep(current, maxDepth - depth);
          if (decodedParams) {
            current = JSON.stringify(decodedParams, null, 2);
            layers.push({
              type: 'url',
              before,
              description: 'URL 参数递归解析',
            });
          }
        }
        // URL 解析完成后停止；参数值已在 parseUrlParamsDeep 中递归处理
        depth = maxDepth;
        break;
      }

      case 'query-string': {
        const decodedParams = parseQueryStringDeep(current, maxDepth - depth);
        if (decodedParams) {
          layers.push({
            type: 'query-string',
            before,
            description: 'CMD 参数递归解析',
          });
          current = JSON.stringify(decodedParams, null, 2);
        } else {
          depth = maxDepth;
        }
        break;
      }
      
      case 'url-encoded': {
        const decoded = urlDecode(current);
        if (decoded !== current) {
          layers.push({
            type: 'url-encoded',
            before,
            description: 'URL Decode',
          });
          current = decoded;
        } else {
          depth = maxDepth;
        }
        break;
      }
      
      case 'base64': {
        const decoded = base64Decode(current);
        if (decoded !== current && decoded.length > 0) {
          layers.push({
            type: 'base64',
            before,
            description: 'Base64 Decode',
          });
          current = decoded;
        } else {
          depth = maxDepth;
        }
        break;
      }
      
      case 'jwt': {
        const decoded = decodeJwt(current);
        if (decoded) {
          layers.push({
            type: 'jwt',
            before,
            description: 'JWT Decode (Payload)',
          });
          current = JSON.stringify(decoded.payload, null, 2);
        } else {
          depth = maxDepth;
        }
        break;
      }
    }

    depth++;
  }

  // 尝试解析最终结果为 JSON
  let isJson = false;
  let finalDecoded = current;
  
  if (isJsonString(current)) {
    isJson = true;
    try {
      finalDecoded = JSON.stringify(JSON.parse(current), null, 2);
    } catch {
      // 保持原样
    }
  }

  return {
    original: input,
    decoded: finalDecoded,
    layers,
    isJson,
    schemeInfo,
  };
}

// ============ 反向编码 ============

/**
 * 根据解码层级，逆向编码回原始格式
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const stringifyParamValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
};

const buildQueryStringFromObject = (value: Record<string, unknown>): string => {
  const params = new URLSearchParams();

  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) continue;

    if (Array.isArray(item)) {
      item.forEach(child => params.append(key, stringifyParamValue(child)));
    } else {
      params.append(key, stringifyParamValue(item));
    }
  }

  return params.toString();
};

const parseEditedQueryObject = (content: string): Record<string, unknown> | null => {
  try {
    const parsed: unknown = JSON.parse(content);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

// 保留 hash route 的路径前缀，只替换其中的查询参数部分。
const replaceHashParams = (hash: string, queryString: string): string => {
  const fragment = hash.replace(/^#/, '');

  if (!fragment) {
    return queryString ? `?${queryString}` : '';
  }

  if (fragment.startsWith('?')) {
    return queryString ? `?${queryString}` : '';
  }

  const queryStart = fragment.indexOf('?');
  if (queryStart >= 0) {
    return queryString ? `${fragment.slice(0, queryStart + 1)}${queryString}` : fragment.slice(0, queryStart);
  }

  if (QUERY_PAIR_START_RE.test(normalizeQueryString(fragment))) {
    return queryString;
  }

  return queryString ? `${fragment}?${queryString}` : fragment;
};

const encodeUrlLayerContent = (content: string, originalUrl: string): string => {
  const editedParams = parseEditedQueryObject(content);
  if (!editedParams) return content;

  try {
    const url = new URL(originalUrl);
    const hasQueryParams = Boolean(url.search);
    const hasHashParams = Boolean(getFragmentParamSource(url.hash));

    if (hasQueryParams && hasHashParams) {
      // query 与 hash 同时存在时，解析结果用 _hash 承载 hash route 参数。
      const { _hash: hashParams, ...queryParams } = editedParams;
      url.search = buildQueryStringFromObject(queryParams);
      url.hash = replaceHashParams(
        url.hash,
        buildQueryStringFromObject(isPlainObject(hashParams) ? hashParams : {})
      );
      return url.toString();
    }

    if (hasHashParams) {
      url.hash = replaceHashParams(url.hash, buildQueryStringFromObject(editedParams));
      return url.toString();
    }

    url.search = buildQueryStringFromObject(editedParams);
    return url.toString();
  } catch {
    return content;
  }
};

export function encodeWithLayers(content: string, layers: DecodeLayer[]): string {
  let result = content;
  
  // 如果内容是对象或数组，先 stringify
  if (typeof content === 'object') {
    result = JSON.stringify(content);
  }
  
  // 逆序遍历解码层，依次重新编码
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    
    switch (layer.type) {
      case 'url-encoded':
        result = urlEncode(result);
        break;
      case 'base64':
        result = base64Encode(result);
        break;
      case 'jwt':
        // JWT 不支持重新编码（因为需要签名）
        // 只返回修改后的 payload 部分
        break;
      case 'url':
        result = layer.before ? encodeUrlLayerContent(result, layer.before) : result;
        break;
      case 'query-string':
        try {
          const parsed = JSON.parse(result) as unknown;
          result = isPlainObject(parsed) ? buildQueryStringFromObject(parsed) : result;
        } catch {
          // 保持原样
        }
        break;
    }
  }
  
  return result;
}
