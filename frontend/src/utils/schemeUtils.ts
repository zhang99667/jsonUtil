/**
 * Scheme 字符串检测和编解码工具
 * 支持 URL、Base64、JWT 等常见 scheme 的识别和解析
 */

// ============ 类型定义 ============

export type SchemeType = 
  | 'url'           // 带协议的 URL (https://, myapp://, etc.)
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
    params?: Record<string, string>; // 查询参数
  };
}

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
  
  // Base64 字符集 + padding
  if (!/^[A-Za-z0-9+/]+=*$/.test(trimmed) && !/^[A-Za-z0-9_-]+=*$/.test(trimmed)) {
    return false;
  }
  // 尝试解码验证
  try {
    const decoded = atob(trimmed.replace(/-/g, '+').replace(/_/g, '/'));
    // 解码后应该是可打印字符或有效 UTF-8
    return decoded.length > 0 && /^[\x20-\x7E\u4e00-\u9fa5\s{}[\]":,]+$/.test(decoded);
  } catch {
    return false;
  }
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

/**
 * Base64 解码
 */
export function base64Decode(str: string): string {
  try {
    // 处理 Base64URL 格式
    const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
    return atob(normalized);
  } catch {
    return str;
  }
}

/**
 * Base64 编码
 */
export function base64Encode(str: string): string {
  try {
    return btoa(str);
  } catch {
    return str;
  }
}

/**
 * 解析 JWT Token
 */
export function decodeJwt(token: string): { header: any; payload: any; signature: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const header = JSON.parse(base64Decode(parts[0]));
    const payload = JSON.parse(base64Decode(parts[1]));
    
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
        // 解析 URL，提取参数并尝试解码参数值
        const urlInfo = parseUrl(current);
        if (urlInfo) {
          schemeInfo = urlInfo;
          
          // 如果有参数，尝试找到可能包含编码数据的参数
          if (urlInfo.params) {
            // 常见的数据参数名
            const dataParams = ['data', 'params', 'payload', 'body', 'json', 'config'];
            for (const paramName of dataParams) {
              if (urlInfo.params[paramName]) {
                current = urlInfo.params[paramName];
                layers.push({
                  type: 'url',
                  before,
                  description: `URL 参数提取 (${paramName})`,
                });
                break;
              }
            }
            
            // 如果没找到特定参数，取第一个看起来像编码数据的参数
            if (current === before) {
              for (const [key, value] of Object.entries(urlInfo.params)) {
                if (hasUrlEncoding(value) || isBase64(value) || isJsonString(value)) {
                  current = value;
                  layers.push({
                    type: 'url',
                    before,
                    description: `URL 参数提取 (${key})`,
                  });
                  break;
                }
              }
            }
          }
        }
        
        // 如果 URL 没有可解析的参数，停止
        if (current === before) {
          depth = maxDepth; // 退出循环
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
    const parsed = JSON.parse(jsonString);
    const lines = jsonString.split('\n');
    
    const traverse = (obj: any, currentPath: string) => {
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
        for (const key in obj) {
          traverse(obj[key], `${currentPath}.${key}`);
        }
      }
    };
    
    traverse(parsed, '$');
  } catch {
    // JSON 解析失败，返回空数组
  }
  
  return results;
}