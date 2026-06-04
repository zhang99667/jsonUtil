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
    params?: Record<string, string>; // 原始查询参数（URLSearchParams 已做一层解码）
  };
}

type StructuredValue =
  | string
  | number
  | boolean
  | null
  | StructuredValue[]
  | { [key: string]: StructuredValue };

const COMMON_CMD_PARAM_NAMES = new Set([
  'cmd',
  'action_cmd',
  'command',
  'schema',
  'scheme',
  'url',
  'uri',
  'link',
  'target',
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
  
  // 排除 URL 格式（真正的 scheme:// 不应被视为查询参数）
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return false;
  
  // 必须以 key= 开头（key 是有效的参数名格式）
  if (!/^[a-zA-Z_][a-zA-Z0-9_-]*=/.test(trimmed)) return false;
  
  // 如果以 key= 开头且包含 & 分隔符，认定为查询参数格式
  // 不再严格检查每部分的格式，因为部分值可能包含 URL 编码
  if (trimmed.includes('&')) {
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
  const source = trimmed.startsWith('?') ? trimmed.slice(1) : trimmed;

  if (!source || /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(source)) return false;
  if (!/^[a-zA-Z_][a-zA-Z0-9_-]*=/.test(source)) return false;

  if (source.includes('&')) return true;

  const equalIndex = source.indexOf('=');
  const key = source.slice(0, equalIndex).toLowerCase();
  const value = source.slice(equalIndex + 1);
  return COMMON_CMD_PARAM_NAMES.has(key) && (
    hasUrlEncoding(value) ||
    isUrl(value) ||
    isJwt(value) ||
    isBase64(value) ||
    isJsonString(value)
  );
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
  // 每部分都应该是 Base64URL
  return parts.every(part => /^[A-Za-z0-9_-]+$/.test(part));
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
    
    const header = JSON.parse(base64Decode(parts[0])) as Record<string, unknown>;
    const payload = JSON.parse(base64Decode(parts[1])) as Record<string, unknown>;
    
    return { header, payload, signature: parts[2] };
  } catch {
    return null;
  }
}

/**
 * 解析 URL，提取参数
 */
export function parseUrl(urlString: string): SchemeDecodeResult['schemeInfo'] | null {
  try {
    // 处理自定义 scheme（如 myapp://）
    const url = new URL(urlString);
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return {
      protocol: url.protocol,
      host: url.host || undefined,
      path: url.pathname || undefined,
      params: Object.keys(params).length > 0 ? params : undefined,
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

const assignQueryParam = (
  result: { [key: string]: StructuredValue | StructuredValue[] },
  key: string,
  value: StructuredValue
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

const parseQueryStringDeep = (queryString: string, maxDepth: number): StructuredValue | null => {
  const source = queryString.trim().replace(/^\?/, '');
  if (!source || !isDecodableQueryString(source)) return null;

  return parseSearchParamsDeep(new URLSearchParams(source), maxDepth);
};

const parseSearchParamsDeep = (params: URLSearchParams, maxDepth: number): StructuredValue => {
  const result: { [key: string]: StructuredValue | StructuredValue[] } = {};
  params.forEach((value, key) => {
    assignQueryParam(result, key, decodeNestedParamValue(value, maxDepth - 1));
  });
  return result as StructuredValue;
};

const decodeNestedParamValue = (value: string, maxDepth: number): StructuredValue => {
  if (maxDepth <= 0) return value;

  const jsonValue = tryParseJson(value);
  if (jsonValue !== null) {
    return decodeStructuredValue(jsonValue, maxDepth - 1);
  }

  const nested = deepDecodeScheme(value, maxDepth);
  if (nested.isJson) {
    const parsed = tryParseJson(nested.decoded);
    return parsed === null ? nested.decoded : decodeStructuredValue(parsed, maxDepth - 1);
  }

  return nested.layers.length > 0 ? nested.decoded : value;
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
          
          // 如果有参数，将参数按 CMD 习惯逐项递归展开
          if (urlInfo.params && Object.keys(urlInfo.params).length > 0) {
            const decodedParams = parseSearchParamsDeep(new URL(current).searchParams, maxDepth - depth);
            current = JSON.stringify(decodedParams, null, 2);
            layers.push({
              type: 'url',
              before,
              description: 'URL 参数递归解析',
            });
          }
        }
        // URL 解析完成后停止；参数值已在 parseQueryStringDeep 中递归处理
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
        // URL 参数需要特殊处理
        // 这里假设原始 URL 结构保存在 layer.before 中
        if (layer.before) {
          try {
            const url = new URL(layer.before);
            // 提取参数名（从 description 中）
            const paramMatch = layer.description.match(/\(([^)]+)\)/);
            if (paramMatch) {
              const paramName = paramMatch[1];
              url.searchParams.set(paramName, result);
              result = url.toString();
            }
          } catch {
            // 保持原样
          }
        }
        break;
      case 'query-string':
        try {
          const parsed = JSON.parse(result) as Record<string, unknown>;
          result = new URLSearchParams(
            Object.entries(parsed).reduce<Record<string, string>>((acc, [key, value]) => {
              acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
              return acc;
            }, {})
          ).toString();
        } catch {
          // 保持原样
        }
        break;
    }
  }
  
  return result;
}

// ============ JSON 内 Scheme 检测 ============

export interface SchemeLocation {
  path: string;           // JSON Path，如 "$.action_cmd"
  line: number;           // 行号（1-based）
  value: string;          // 原始值
  schemeType: SchemeType; // scheme 类型
}

/**
 * 将字符串转换为可能的 JSON 转义形式（用于行内匹配）
 * 例如 "https://example.com" 可能在 JSON 中被写成 "https:\/\/example.com"
 */
function getJsonEscapeVariants(str: string): string[] {
  const variants = [str];
  
  // JSON 中 / 可能被转义为 \/
  if (str.includes('/')) {
    variants.push(str.replace(/\//g, '\\/'));
  }
  
  return variants;
}

/**
 * 扫描 JSON 字符串，找出所有包含 scheme 的字符串值及其位置
 */
export function findSchemesInJson(jsonString: string): SchemeLocation[] {
  const results: SchemeLocation[] = [];
  
  try {
    const parsed: unknown = JSON.parse(jsonString);
    const lines = jsonString.split('\n');
    
    const traverse = (obj: unknown, currentPath: string) => {
      if (typeof obj === 'string') {
        const schemeType = detectSchemeType(obj);
        if (schemeType !== 'plain' && schemeType !== 'json') {
          // 找到该值在 JSON 中的行号
          const pathParts = currentPath.split('.');
          const key = pathParts[pathParts.length - 1];
          
          // 获取值前缀的多种可能形式（处理 JSON 转义）
          const valuePrefix = obj.substring(0, Math.min(30, obj.length));
          const prefixVariants = getJsonEscapeVariants(valuePrefix);
          
          let lineNumber = 1;
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // 检查该行是否包含这个 key
            if (line.includes(`"${key}"`)) {
              // 检查是否包含值的任意一种转义形式
              const hasValue = prefixVariants.some(variant => line.includes(variant));
              if (hasValue) {
                lineNumber = i + 1;
                break;
              }
            }
          }
          
          results.push({
            path: currentPath,
            line: lineNumber,
            value: obj,
            schemeType,
          });
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          traverse(item, `${currentPath}[${index}]`);
        });
      } else if (typeof obj === 'object' && obj !== null) {
        for (const key in (obj as Record<string, unknown>)) {
          traverse((obj as Record<string, unknown>)[key], `${currentPath}.${key}`);
        }
      }
    };
    
    traverse(parsed, '$');
  } catch {
    // JSON 解析失败，返回空数组
  }
  
  return results;
}
