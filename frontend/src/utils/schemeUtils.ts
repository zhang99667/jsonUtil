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

type DecodeLayerType = SchemeType | 'json-escaped-slash';

export interface DecodeLayer {
  type: DecodeLayerType;
  before: string;     // 解码前的内容
  description: string; // 描述，如 "URL Decode", "Base64 Decode"
  reversible?: boolean; // 是否可按原格式重新编码
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

export interface SchemeDecodeWarning {
  type: 'json_string_decode_skipped'; // JSON response 内部字符串递归展开被性能护栏跳过
  message: string;                    // 面向用户的说明
  skippedCount: number;               // 跳过的字符串数量
  decodedStringCount: number;         // 已尝试展开的字符串数量
  totalStringLength: number;          // 已计入预算的字符串总长度
  limit: number;                      // 累计字符串预算
  paths: string[];                    // 部分跳过路径
}

export interface SchemeDecodeResult {
  original: string;           // 原始字符串
  decoded: string;            // 最终解码结果
  layers: DecodeLayer[];      // 解码层级
  isJson: boolean;            // 最终结果是否为有效 JSON
  placeholders?: SchemePlaceholder[]; // 运行时占位符
  warnings?: SchemeDecodeWarning[]; // 解析过程中的性能护栏提示
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

interface LogFieldParam {
  prefix?: string;
  rawKey: string;
  key: string;
  delimiter: ':' | '：' | '=' | '=>' | '->';
  value: string;
  quote?: '"' | "'";
  trailingComma?: boolean;
}

interface PrefixedQueryString {
  prefix: string;
  queryString: string;
}

interface DecodeStructuredState {
  maxStringDecodeLength: number;
  maxTotalStringDecodeLength: number;
  totalStringDecodeLength: number;
  decodedStringCount: number;
  skippedStringCount: number;
  skippedPaths: string[];
}

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
  'redirect',
  'redirect_url',
  'next',
  'next_url',
  'fallback_url',
  'deep_link',
  'deeplink',
  'jump_url',
  'landing_url',
  'h5_url',
  'page_url',
  'web_url',
  'detail_url',
  'lp_real_url',
  'locid',
  's_url',
  'app_url',
  'open_app_url',
  'download_url',
  'apk_url',
  'deeplink_url',
  'deep_link_url',
  'landing_page_url',
  'params',
  'param',
  'task_params',
  'reward',
  'ext_params',
  'ext_policy',
  'task_policy',
  'video_info',
  'ext_info',
  'rotation_component',
  'extra_param',
  'ubs_param',
  'sbox_param',
  'ad_tag',
  'toolbar_icons',
  'render_sbox',
  'ad_extra_param',
  'ad_flag',
  'convert_cmd',
  'panel_cmd',
  'webpanel_cmd',
  'stay_cmd',
  'reward_cmd',
  'strong_guide_cmd',
  'button_scheme',
  'bottom_button_scheme',
  'panel_scheme',
  'button_cmd',
  'convert_btn',
  'main_btn',
  'bottom_left_btn',
  'bottom_right_btn',
  'click_event_cmd',
  'webpanel_event_cmd',
  'ad_monitor_url',
  'monitor_url',
  'click_url',
  'data',
  'payload',
  'ext',
  'extra',
  'callback',
  'callback_url',
  'open_url',
]);

const normalizeCmdParamName = (key: string): string => (
  key.toLowerCase().replace(/[_-]/g, '')
);

const COMMON_CMD_PARAM_NAME_ALIASES = new Set([
  ...COMMON_CMD_PARAM_NAMES,
  ...Array.from(COMMON_CMD_PARAM_NAMES, normalizeCmdParamName),
]);

const STRUCTURED_PARAM_SUFFIX_RE = /(?:^|[_-])(?:cmd|command|schema|scheme|url|uri|link|params?|policy|info)$/i;
const STRUCTURED_CAMEL_PARAM_SUFFIX_RE = /[a-z0-9](?:Cmd|Command|Schema|Scheme|URL|Url|URI|Uri|Link|Params?|Policy|Info)$/;

const isLikelyStructuredParamName = (key: string): boolean => (
  STRUCTURED_PARAM_SUFFIX_RE.test(key) || STRUCTURED_CAMEL_PARAM_SUFFIX_RE.test(key)
);

const isKnownDecodableParamName = (key: string): boolean => {
  const normalizedKey = normalizeCmdParamName(key);
  return COMMON_CMD_PARAM_NAME_ALIASES.has(key.toLowerCase()) ||
    COMMON_CMD_PARAM_NAME_ALIASES.has(normalizedKey) ||
    isLikelyStructuredParamName(key);
};

const QUERY_KEY_PATTERN = '[A-Za-z0-9_.\\-[\\]%]+';
const QUERY_PAIR_START_RE = new RegExp(`^${QUERY_KEY_PATTERN}=`);
const QUERY_PAIR_DELIMITER_RE = new RegExp(`[&;](?=${QUERY_KEY_PATTERN}=)`);
const SEMICOLON_QUERY_DELIMITER_RE = new RegExp(`;(?=${QUERY_KEY_PATTERN}=)`, 'g');
const HTML_QUERY_DELIMITER_RE = new RegExp(`&(?:amp|#38);(?=${QUERY_KEY_PATTERN}=)`, 'g');
const UNICODE_AMP_QUERY_DELIMITER_RE = new RegExp(`\\\\u0026(?=${QUERY_KEY_PATTERN}=)`, 'gi');
const ESCAPED_LINE_QUERY_DELIMITER_RE = new RegExp(`(?:\\\\r\\\\n|\\\\n)[ \\t]*(?=${QUERY_KEY_PATTERN}=)`, 'g');
const LINE_QUERY_DELIMITER_RE = new RegExp(`\\r?\\n[ \\t]*(?=${QUERY_KEY_PATTERN}=)`, 'g');
const PREFIXED_QUERY_BOUNDARY_PATTERN = '[\\s\\[\\]{}(),|:：>]';
const PREFIXED_QUERY_STRING_RE = new RegExp(`^(.*?${PREFIXED_QUERY_BOUNDARY_PATTERN})([?&]*${QUERY_KEY_PATTERN}=.+)$`);
const PROTOCOL_RELATIVE_URL_BASE = 'https:';
const BARE_HOST_URL_BASE = 'https://';
export const DEFAULT_SCHEME_DECODE_MAX_DEPTH = 15;
export const DEFAULT_SCHEME_JSON_STRING_DECODE_LIMIT = 256_000;
export const DEFAULT_SCHEME_JSON_TOTAL_STRING_DECODE_LIMIT = 1_500_000;
const DEFAULT_SCHEME_JSON_SKIPPED_PATH_LIMIT = 8;

const normalizeJsonEscapedSlashes = (source: string): string => (
  source.replace(/\\\//g, '/')
);

const normalizeQueryString = (source: string): string => (
  source.trim()
    .replace(HTML_QUERY_DELIMITER_RE, '&')
    .replace(UNICODE_AMP_QUERY_DELIMITER_RE, '&')
    .replace(SEMICOLON_QUERY_DELIMITER_RE, '&')
    .replace(ESCAPED_LINE_QUERY_DELIMITER_RE, '&')
    .replace(LINE_QUERY_DELIMITER_RE, '&')
);

const stripQueryPrefix = (source: string): string => (
  source.trim().replace(/^\?/, '').replace(/^&+/, '')
);

const looksLikeQueryString = (source: string): boolean => {
  const normalized = normalizeQueryString(stripQueryPrefix(source));
  return QUERY_PAIR_START_RE.test(normalized);
};

const looksLikeStructuredPayload = (value: string): boolean => {
  const trimmed = value.trim();
  const slashNormalized = normalizeJsonEscapedSlashes(trimmed);
  if (slashNormalized !== trimmed) {
    return looksLikeStructuredPayload(slashNormalized);
  }

  return isJsonString(trimmed) ||
    isUrl(trimmed) ||
    hasUrlEncoding(trimmed) ||
    isJwt(trimmed) ||
    looksLikeQueryString(trimmed);
};

const tryNormalizeJsonEscapedSlashPayload = (value: string): string | null => {
  const trimmed = value.trim();
  const normalized = normalizeJsonEscapedSlashes(trimmed);
  if (normalized === trimmed) return null;

  return looksLikeStructuredPayload(normalized) ? normalized : null;
};

const isStructuredBase64Value = (value: string): boolean => {
  const decoded = base64Decode(value);
  return decoded !== value && looksLikeStructuredPayload(decoded);
};

const RUNTIME_PLACEHOLDER_RE = /^__[A-Z][A-Z0-9_]*__$/;
const RUNTIME_PLACEHOLDER_DESCRIPTIONS: Record<string, string> = {
  __CONVERT_CMD__: '运行时转换 CMD 占位符，当前文本未包含实际 CMD 内容',
  __WEBPANEL_CMD__: '运行时 WebPanel CMD 占位符，当前文本未包含实际 CMD 内容',
  __AD_EXTRA_PARAM_ENCODE_1__: '广告 extraParam 编码占位符，通常由渲染或投放链路在运行时替换',
  __EXT_RENDER_AFD__: 'AFD 渲染扩展信息占位符，当前 response 未携带实际扩展内容',
  __COINTIPS__: '金币奖励文案占位符，运行时会替换为实际奖励提示',
  __REWARD_NUM__: '奖励数量占位符，运行时会替换为实际金币或激励数值',
  __CONTINUEPLAY__: '继续完成任务动作占位符，运行时会绑定继续播放或继续任务行为',
  __LEAVE__: '离开动作占位符，运行时会绑定退出或关闭行为',
  __CLICK_ID__: '点击 ID 占位符，监测链路会在点击发生时替换',
  __SIGN__: '签名占位符，监测链路会在请求发送前替换',
  __CALLBACK_URL__: '回调 URL 占位符，监测链路会在运行时替换',
};

export const isRuntimePlaceholder = (value: string): boolean => (
  RUNTIME_PLACEHOLDER_RE.test(value.trim())
);

const getRuntimePlaceholderDescription = (value: string): string => (
  RUNTIME_PLACEHOLDER_DESCRIPTIONS[value.trim()] ||
  '运行时占位符，当前文本未包含可继续展开的实际内容'
);

const isDecodableParamValue = (value: string): boolean => (
  isRuntimePlaceholder(value) ||
  tryNormalizeJsonEscapedSlashPayload(value) !== null ||
  tryNormalizeJsonEscapedQuotePayload(value) !== null ||
  hasUrlEncoding(value) ||
  isUrl(value) ||
  isJwt(value) ||
  isBase64(value) ||
  isJsonString(value) ||
  isStructuredBase64Value(value)
);

const LOG_FIELD_KEY_PATTERN = `(?:"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|${QUERY_KEY_PATTERN})`;
const LOG_FIELD_SEPARATOR_PATTERN = '(?:\\s*(?:=>|->)\\s*|\\s*[:：]\\s*|\\s+=\\s*|=\\s+)';
const LOG_FIELD_RE = new RegExp(`^\\s*(${LOG_FIELD_KEY_PATTERN})(${LOG_FIELD_SEPARATOR_PATTERN})(.+?)\\s*$`);
const LOG_FIELD_WITH_PREFIX_RE = new RegExp(`^(.*?[\\s[{,(|])(${LOG_FIELD_KEY_PATTERN})(${LOG_FIELD_SEPARATOR_PATTERN})(.+?)\\s*$`);

const matchLogFieldParamString = (
  source: string
): { prefix?: string; rawKey: string; separator: string; rawValue: string } | null => {
  const directMatch = source.match(LOG_FIELD_RE);
  if (directMatch) {
    return {
      rawKey: directMatch[1],
      separator: directMatch[2],
      rawValue: directMatch[3],
    };
  }

  const prefixedMatch = source.match(LOG_FIELD_WITH_PREFIX_RE);
  if (!prefixedMatch) return null;

  return {
    prefix: prefixedMatch[1],
    rawKey: prefixedMatch[2],
    separator: prefixedMatch[3],
    rawValue: prefixedMatch[4],
  };
};

const unwrapLogFieldValue = (value: string): { value: string; quote?: '"' | "'" } => {
  const trimmed = value.trim();
  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    const inner = trimmed.slice(1, -1);
    if (quote === '"') {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (typeof parsed === 'string') {
          return { value: parsed, quote };
        }
      } catch {
        return { value: inner, quote };
      }
    }

    return { value: inner.replace(/\\'/g, "'"), quote };
  }

  return { value: trimmed };
};

const unwrapLogFieldKey = (rawKey: string): string | null => {
  const trimmed = rawKey.trim();
  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    if (quote === '"') {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        return typeof parsed === 'string' ? parsed : null;
      } catch {
        return trimmed.slice(1, -1);
      }
    }

    return trimmed.slice(1, -1).replace(/\\'/g, "'");
  }

  return decodeQueryComponent(trimmed);
};

const unwrapDecodableLogFieldValue = (
  rawValue: string
): { value: string; quote?: '"' | "'"; trailingComma?: boolean } | null => {
  const trimmed = rawValue.trim();
  if (trimmed.endsWith(',')) {
    const withoutCommaSource = trimmed.slice(0, -1).trim();
    const quote = withoutCommaSource[0];
    const shouldPreferTrailingComma = (quote === '"' || quote === "'") && withoutCommaSource.endsWith(quote);
    const withoutTrailingComma = unwrapLogFieldValue(withoutCommaSource);
    if (shouldPreferTrailingComma && isDecodableParamValue(withoutTrailingComma.value)) {
      return { ...withoutTrailingComma, trailingComma: true };
    }
  }

  const unwrappedValue = unwrapLogFieldValue(rawValue);
  if (isDecodableParamValue(unwrappedValue.value)) return unwrappedValue;

  if (!trimmed.endsWith(',')) return null;

  const withoutTrailingComma = unwrapLogFieldValue(trimmed.slice(0, -1));
  return isDecodableParamValue(withoutTrailingComma.value)
    ? { ...withoutTrailingComma, trailingComma: true }
    : null;
};

const normalizeLogFieldDelimiter = (separator: string): LogFieldParam['delimiter'] => {
  if (separator.includes('=>')) return '=>';
  if (separator.includes('->')) return '->';
  if (separator.includes('=')) return '=';
  return separator.includes('：') ? '：' : ':';
};

const parseLogFieldParamString = (source: string): LogFieldParam | null => {
  const trimmed = source.trim();
  // 日志字段只识别单行，避免把多行说明文本误拆成 CMD。
  if (/[\r\n]/.test(trimmed)) return null;

  const match = matchLogFieldParamString(trimmed);
  if (!match) return null;

  const rawKey = match.rawKey;
  const key = unwrapLogFieldKey(rawKey);
  if (!key || !isKnownDecodableParamName(key)) {
    return null;
  }

  const unwrappedValue = unwrapDecodableLogFieldValue(match.rawValue);
  if (!unwrappedValue) return null;

  return {
    prefix: match.prefix,
    rawKey,
    key,
    delimiter: normalizeLogFieldDelimiter(match.separator),
    value: unwrappedValue.value,
    quote: unwrappedValue.quote,
    trailingComma: unwrappedValue.trailingComma,
  };
};

const isDecodableLogFieldParamString = (source: string): boolean => (
  parseLogFieldParamString(source) !== null
);

// ============ 检测函数 ============

const isDomainLikeHost = (host: string): boolean => {
  const hostWithoutPort = host.toLowerCase().replace(/:\d+$/, '');
  if (hostWithoutPort === 'localhost') return true;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostWithoutPort)) return true;

  const labels = hostWithoutPort.split('.');
  const topLevelDomain = labels[labels.length - 1] || '';
  return labels.length >= 2 && /^[a-z]{2,}$/.test(topLevelDomain);
};

const isProtocolRelativeUrl = (str: string): boolean => {
  const match = str.trim().match(/^\/\/([^/?#\s]+)(?:[/?#].*)?$/);
  if (!match) return false;

  const host = match[1];
  return /^[A-Za-z0-9.-]+(?::\d+)?$/.test(host) && isDomainLikeHost(host);
};

const isBareHostUrl = (str: string): boolean => {
  const trimmed = str.trim();
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) || trimmed.startsWith('//')) return false;

  const match = trimmed.match(/^([^/?#\s]+)([/?#].*)$/);
  if (!match) return false;

  const host = match[1];
  return /^[A-Za-z0-9.-]+(?::\d+)?$/.test(host) && isDomainLikeHost(host);
};

const createUrl = (urlString: string): URL => {
  const trimmed = normalizeJsonEscapedSlashes(urlString.trim());
  if (isBareHostUrl(trimmed)) {
    return new URL(`${BARE_HOST_URL_BASE}${trimmed}`);
  }
  return new URL(isProtocolRelativeUrl(trimmed) ? `${PROTOCOL_RELATIVE_URL_BASE}${trimmed}` : trimmed);
};

const stringifyUrlForOriginalShape = (url: URL, originalUrl: string): string => {
  const serialized = url.toString();
  if (isBareHostUrl(originalUrl)) {
    return serialized.slice(BARE_HOST_URL_BASE.length);
  }

  return isProtocolRelativeUrl(originalUrl)
    ? serialized.slice(PROTOCOL_RELATIVE_URL_BASE.length)
    : serialized;
};

/**
 * 检测字符串是否为 URL（包含协议）
 */
export function isUrl(str: string): boolean {
  const trimmed = normalizeJsonEscapedSlashes(str.trim());
  // 匹配 scheme://...、//host/path 和 host/path 这几类常见链接格式
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/.+/.test(trimmed) ||
    isProtocolRelativeUrl(trimmed) ||
    isBareHostUrl(trimmed);
}

/**
 * 检测字符串是否为 URL 查询参数格式 (key=value&key=value...)
 * 这种格式不应该被识别为需要解析的 scheme
 */
export function isQueryStringFormat(str: string): boolean {
  const trimmed = str.trim();
  const source = normalizeQueryString(stripQueryPrefix(trimmed));
  
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
  const source = normalizeQueryString(stripQueryPrefix(trimmed));

  if (!source || /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(source)) return false;
  if (!QUERY_PAIR_START_RE.test(source)) return false;

  if (QUERY_PAIR_DELIMITER_RE.test(source)) return true;

  const equalIndex = source.indexOf('=');
  const key = source.slice(0, equalIndex);
  const value = source.slice(equalIndex + 1);
  return isKnownDecodableParamName(key) && isDecodableParamValue(value);
}

const getPrefixedQueryString = (source: string): PrefixedQueryString | null => {
  const trimmed = source.trim();
  if (/[\r\n]/.test(trimmed)) return null;
  if (isDecodableQueryString(trimmed)) return null;

  const match = trimmed.match(PREFIXED_QUERY_STRING_RE);
  if (!match) return null;

  const queryString = normalizeQueryString(stripQueryPrefix(match[2]));
  if (!queryString || !isDecodableQueryString(queryString)) return null;

  return {
    prefix: match[1],
    queryString,
  };
};

const isDecodablePrefixedQueryString = (source: string): boolean => (
  getPrefixedQueryString(source) !== null
);

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
  const decodedResult = decodeBase64WithMeta(trimmed);
  if (decodedResult && looksLikeStructuredPayload(decodedResult.decoded)) return true;

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
  
  if (!decodedResult || decodedResult.decoded === trimmed || decodedResult.decoded.length === 0) return false;

  // 短 Base64 只有在能明确解出 JSON、URL、CMD 等结构化内容时才识别，避免普通短文本误判。
  if (looksLikeStructuredPayload(decodedResult.decoded)) return true;

  // 普通文本 Base64 保持较高长度门槛，避免把短 token 当成可解析 Scheme。
  if (trimmed.length < 20) return false;

  return isReadableDecodedText(decodedResult.decoded);
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

const normalizeLooseJsonCandidate = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;

  return trimmed
    .replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3')
    .replace(/'((?:\\.|[^'\\])*)'/g, (_, content: string) => (
      JSON.stringify(content.replace(/\\'/g, "'"))
    ))
    .replace(/,\s*([}\]])/g, '$1');
};

const normalizeJsonEscapedQuoteCandidate = (value: string): string | null => {
  const trimmed = value.trim();
  if ((!trimmed.startsWith('{') && !trimmed.startsWith('[')) || !trimmed.includes('\\"')) {
    return null;
  }

  return normalizeJsonEscapedSlashes(trimmed.replace(/\\"/g, '"'));
};

const tryNormalizeJsonEscapedQuotePayload = (value: string): string | null => {
  const normalized = normalizeJsonEscapedQuoteCandidate(value);
  if (!normalized) return null;
  if (isJsonString(normalized)) return normalized;

  const looseJson = normalizeLooseJsonCandidate(normalized);
  return looseJson && isJsonString(looseJson) ? looseJson : null;
};

/**
 * 检测字符串的 scheme 类型
 */
export function detectSchemeType(str: string): SchemeType {
  if (!str || typeof str !== 'string') return 'plain';

  const trimmed = str.trim();
  const jsonStringPayload = tryParseJsonStringPayload(trimmed);
  if (jsonStringPayload !== null) {
    return detectSchemeType(jsonStringPayload);
  }

  const escapedSlashPayload = tryNormalizeJsonEscapedSlashPayload(trimmed);
  if (escapedSlashPayload !== null) {
    return detectSchemeType(escapedSlashPayload);
  }

  const escapedQuotePayload = tryNormalizeJsonEscapedQuotePayload(trimmed);
  if (escapedQuotePayload !== null) {
    return detectSchemeType(escapedQuotePayload);
  }

  // 优先级顺序很重要
  if (isJsonString(trimmed)) return 'json';
  if (isJwt(trimmed)) return 'jwt';
  if (isUrl(trimmed)) return 'url';
  if (isDecodableFragmentParamString(trimmed)) return 'query-string';
  if (isDecodableLogFieldParamString(trimmed)) return 'query-string';
  if (isDecodableQueryString(trimmed)) return 'query-string';
  if (isDecodablePrefixedQueryString(trimmed)) return 'query-string';
  if (hasUrlEncoding(trimmed)) return 'url-encoded';
  if (isBase64(trimmed)) return 'base64';

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

const decodeQueryValueComponent = (str: string): string => {
  const formDecoded = decodeQueryComponent(str);
  if (!str.includes('+')) return formDecoded;

  const plusPreserved = urlDecode(str);
  if (plusPreserved === formDecoded) return formDecoded;

  // 真实日志里 Base64 字段可能直接带字面量 +，仅在保留后能解析成结构化值时回退为原值语义。
  return isDecodableParamValue(plusPreserved) && !isDecodableParamValue(formDecoded)
    ? plusPreserved
    : formDecoded;
};

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

interface Base64DecodeResult {
  decoded: string;
  reversible: boolean;
}

const decodeNormalizedBase64 = (normalized: string): string | null => {
  try {
    const bytes = binaryStringToBytes(atob(normalized));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
};

const decodeNormalizedBase64ReadablePrefix = (normalized: string): string | null => {
  try {
    const bytes = binaryStringToBytes(atob(normalized));
    const decoded = new TextDecoder('utf-8').decode(bytes);
    const stopIndex = decoded.search(/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/);
    const readablePrefix = (stopIndex >= 0 ? decoded.slice(0, stopIndex) : decoded).trim();
    return readablePrefix || null;
  } catch {
    return null;
  }
};

const normalizeBase64JsonFragment = (decoded: string): string | null => {
  const trimmed = decoded.trim();
  const candidates = [
    trimmed,
    trimmed.startsWith('"') ? `{${trimmed}` : '',
    /^[A-Za-z_$][\w$]*":/.test(trimmed) ? `{"${trimmed}` : '',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!isJsonString(candidate)) continue;
    return candidate;
  }

  return null;
};

const appendPrefixedBase64Meta = (
  jsonFragment: string,
  prefix: string,
  suffix: string
): string => {
  if (!suffix) return jsonFragment;

  try {
    const parsed = JSON.parse(jsonFragment) as StructuredValue;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return jsonFragment;
    }

    const suffixMeta = parsePrefixedBase64Suffix(suffix);

    return JSON.stringify({
      ...parsed,
      _base64_prefix: prefix,
      _base64_suffix: suffix,
      ...(suffixMeta ? {
        _base64_suffix_decode_prefix: suffixMeta.prefix,
        _base64_suffix_decoded: suffixMeta.value,
      } : {}),
    });
  } catch {
    return jsonFragment;
  }
};

const trimDecodedSuffixQueryPayload = (decoded: string): string => {
  const trimmed = decoded.trim();
  if (!looksLikeQueryString(trimmed)) return decoded;

  // 真实 extraParam 后缀可能在 query 前缀后继续拼接 JSON 残片，直接按 & 拆会污染最后一个参数。
  const jsonFragmentIndex = trimmed.search(/","[A-Za-z_$][\w$]*":/);
  return jsonFragmentIndex > 0 ? trimmed.slice(0, jsonFragmentIndex) : decoded;
};

const parsePrefixedBase64Suffix = (
  suffix: string
): { prefix: string; value: StructuredValue } | null => {
  const compact = suffix.trim().replace(/\s+/g, '');
  if (!compact) return null;

  // 真实 extraParam 后缀常带少量内部头字符，跳过后可解出 query-string。
  for (let offset = 0; offset <= 12 && offset < compact.length; offset++) {
    const candidate = compact.slice(offset);
    const normalized = normalizeBase64Input(candidate);
    if (!normalized) continue;

    const strictDecoded = decodeNormalizedBase64(normalized);
    const decoded = strictDecoded && isReadableDecodedText(strictDecoded)
      ? strictDecoded
      : decodeNormalizedBase64ReadablePrefix(normalized);
    if (!decoded || !looksLikeStructuredPayload(decoded)) continue;

    const parsed = decodeNestedParamValue(trimDecodedSuffixQueryPayload(decoded), DEFAULT_SCHEME_DECODE_MAX_DEPTH);
    if (parsed && typeof parsed === 'object') {
      return {
        prefix: compact.slice(0, offset),
        value: parsed,
      };
    }
  }

  return null;
};

const decodePrefixedBase64JsonFragment = (input: string): string | null => {
  const compact = input.trim().replace(/\s+/g, '');
  const firstPaddingIndex = compact.indexOf('=');
  const payloadEnd = firstPaddingIndex >= 0
    ? firstPaddingIndex + (compact[firstPaddingIndex + 1] === '=' ? 2 : 1)
    : compact.length;

  // 兼容真实广告 extraParam 中带内部头的 Base64 JSON 片段，保持解析保守，避免普通文本误判。
  for (let offset = 1; offset <= 12 && offset < payloadEnd; offset++) {
    const candidate = compact.slice(offset, payloadEnd);
    const normalized = normalizeBase64Input(candidate);
    if (!normalized) continue;

    const decoded = decodeNormalizedBase64(normalized);
    if (!decoded) continue;

    const jsonFragment = normalizeBase64JsonFragment(decoded);
    if (jsonFragment) {
      const prefix = compact.slice(0, offset);
      const suffix = compact.slice(payloadEnd);
      return appendPrefixedBase64Meta(jsonFragment, prefix, suffix);
    }
  }

  return null;
};

const decodeBase64WithMeta = (input: string): Base64DecodeResult | null => {
  const normalized = normalizeBase64Input(input);
  if (normalized) {
    const decoded = decodeNormalizedBase64(normalized);
    if (decoded !== null) {
      return { decoded, reversible: true };
    }
  }

  const prefixedJson = decodePrefixedBase64JsonFragment(input);
  return prefixedJson ? { decoded: prefixedJson, reversible: false } : null;
};

/**
 * Base64 解码
 */
export function base64Decode(str: string): string {
  return decodeBase64WithMeta(str)?.decoded ?? str;
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

const formatPlaceholderPathSegment = (key: string): string => (
  /^[A-Za-z_$][\w$]*$/.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`
);

const collectRuntimePlaceholders = (
  value: StructuredValue,
  path: string = '$'
): SchemePlaceholder[] => {
  if (typeof value === 'string') {
    return isRuntimePlaceholder(value)
      ? [{ path, value, description: getRuntimePlaceholderDescription(value) }]
      : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectRuntimePlaceholders(item, `${path}[${index}]`));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => (
      collectRuntimePlaceholders(item, `${path}${formatPlaceholderPathSegment(key)}`)
    ));
  }

  return [];
};

export const buildSchemePlaceholderGroups = (
  placeholders: SchemePlaceholder[]
): SchemePlaceholderGroup[] => {
  const groups = new Map<string, SchemePlaceholderGroup>();

  placeholders.forEach(placeholder => {
    const group = groups.get(placeholder.value);
    if (group) {
      group.count += 1;
      group.paths.push(placeholder.path);
      return;
    }

    groups.set(placeholder.value, {
      value: placeholder.value,
      description: placeholder.description,
      count: 1,
      paths: [placeholder.path],
    });
  });

  return Array.from(groups.values()).sort((left, right) => (
    right.count - left.count || left.value.localeCompare(right.value)
  ));
};

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
  normalizeQueryString(stripQueryPrefix(queryString)).split(QUERY_PAIR_DELIMITER_RE).filter(Boolean)
);

interface SingleRawUrlParam {
  rawKey: string;
  key: string;
  value: string;
}

const getSingleRawUrlParam = (queryString: string): SingleRawUrlParam | null => {
  const source = normalizeQueryString(stripQueryPrefix(queryString));
  if (!QUERY_PAIR_DELIMITER_RE.test(source)) return null;

  const equalIndex = source.indexOf('=');
  if (equalIndex <= 0) return null;

  const rawKey = source.slice(0, equalIndex);
  const key = decodeQueryComponent(rawKey);
  if (!key || !isKnownDecodableParamName(key)) return null;

  const rawValue = source.slice(equalIndex + 1);
  if (!isUrl(rawValue)) return null;

  const value = decodeQueryValueComponent(rawValue);
  return isUrl(value) ? { rawKey, key, value } : null;
};

const parseFlatQueryParams = (queryString: string): Record<string, string | string[]> | undefined => {
  const params: Record<string, string | string[]> = {};

  splitQueryPairs(queryString).forEach(pair => {
    const equalIndex = pair.indexOf('=');
    if (equalIndex <= 0) return;

    const key = decodeQueryComponent(pair.slice(0, equalIndex));
    const value = decodeQueryValueComponent(pair.slice(equalIndex + 1));
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

const isDecodableFragmentParamString = (source: string): boolean => {
  const trimmed = source.trim();
  if (!trimmed.startsWith('#') && !trimmed.startsWith('/') && !trimmed.startsWith('?')) {
    return false;
  }

  const fragmentParamSource = getFragmentParamSource(trimmed);
  return fragmentParamSource !== null && isDecodableQueryString(fragmentParamSource);
};

/**
 * 解析 URL，提取参数
 */
export function parseUrl(urlString: string): SchemeDecodeResult['schemeInfo'] | null {
  try {
    // 处理自定义 scheme（如 myapp://）
    const url = createUrl(urlString);
    const isBareUrl = isBareHostUrl(urlString);
    const isProtocolRelative = isProtocolRelativeUrl(urlString);
    const params = parseFlatQueryParams(url.search);
    const fragmentParamSource = getFragmentParamSource(url.hash);
    const hashParams = fragmentParamSource ? parseFlatQueryParams(fragmentParamSource) : undefined;
    
    return {
      protocol: isBareUrl ? '无协议' : isProtocolRelative ? '//' : url.protocol,
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
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;

  try {
    return JSON.parse(trimmed) as StructuredValue;
  } catch {
    const candidates = [
      normalizeJsonEscapedQuoteCandidate(trimmed),
      normalizeLooseJsonCandidate(trimmed),
    ].filter((candidate): candidate is string => Boolean(candidate));

    for (const candidate of candidates) {
      const looseCandidate = normalizeLooseJsonCandidate(candidate);
      for (const jsonCandidate of [candidate, looseCandidate].filter((item): item is string => Boolean(item))) {
        try {
          return JSON.parse(jsonCandidate) as StructuredValue;
        } catch {
          // 继续尝试下一个候选，兼容日志里混用转义引号和 loose JSON 的片段。
        }
      }
    }

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

const createDecodeStructuredState = (): DecodeStructuredState => ({
  maxStringDecodeLength: DEFAULT_SCHEME_JSON_STRING_DECODE_LIMIT,
  maxTotalStringDecodeLength: DEFAULT_SCHEME_JSON_TOTAL_STRING_DECODE_LIMIT,
  totalStringDecodeLength: 0,
  decodedStringCount: 0,
  skippedStringCount: 0,
  skippedPaths: [],
});

const markStructuredStringSkipped = (state: DecodeStructuredState, path: string) => {
  state.skippedStringCount += 1;
  if (state.skippedPaths.length < DEFAULT_SCHEME_JSON_SKIPPED_PATH_LIMIT) {
    state.skippedPaths.push(path);
  }
};

const shouldSkipStructuredStringDecode = (
  value: string,
  path: string,
  state?: DecodeStructuredState
): boolean => {
  if (!state) return false;

  if (
    value.length > state.maxStringDecodeLength ||
    state.totalStringDecodeLength + value.length > state.maxTotalStringDecodeLength
  ) {
    markStructuredStringSkipped(state, path);
    return true;
  }

  state.totalStringDecodeLength += value.length;
  state.decodedStringCount += 1;
  return false;
};

const buildDecodeStructuredWarnings = (state: DecodeStructuredState): SchemeDecodeWarning[] | undefined => (
  state.skippedStringCount > 0
    ? [{
        type: 'json_string_decode_skipped',
        message: '部分 JSON 字符串因性能保护未递归展开，可复制对应字段单独解析',
        skippedCount: state.skippedStringCount,
        decodedStringCount: state.decodedStringCount,
        totalStringLength: state.totalStringDecodeLength,
        limit: state.maxTotalStringDecodeLength,
        paths: state.skippedPaths,
      }]
    : undefined
);

const decodeStructuredValue = (
  value: StructuredValue,
  maxDepth: number,
  state?: DecodeStructuredState,
  path: string = '$'
): StructuredValue => {
  if (maxDepth <= 0) return value;

  if (typeof value === 'string') {
    if (detectSchemeType(value) === 'plain') return value;
    if (shouldSkipStructuredStringDecode(value, path, state)) return value;
    return decodeNestedParamValue(value, maxDepth - 1);
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => decodeStructuredValue(item, maxDepth, state, `${path}[${index}]`));
  }

  if (value && typeof value === 'object') {
    const result: { [key: string]: StructuredValue } = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = decodeStructuredValue(item, maxDepth, state, `${path}${formatPlaceholderPathSegment(key)}`);
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
  const logFieldParam = parseLogFieldParamString(queryString);
  if (logFieldParam) {
    return {
      [logFieldParam.key]: decodeNestedParamValue(logFieldParam.value, maxDepth - 1),
    };
  }

  const source = normalizeQueryString(stripQueryPrefix(queryString));
  if (source && isDecodableQueryString(source)) {
    return parseQueryPairsDeep(source, maxDepth);
  }

  const prefixedQueryString = getPrefixedQueryString(queryString);
  if (prefixedQueryString) {
    return parseQueryPairsDeep(prefixedQueryString.queryString, maxDepth);
  }

  const fragmentParamSource = getFragmentParamSource(queryString);
  if (!fragmentParamSource || !isDecodableQueryString(fragmentParamSource)) return null;

  return parseQueryPairsDeep(fragmentParamSource, maxDepth);
};

const parseUrlQueryStringDeep = (queryString: string, maxDepth: number): StructuredValue | null => {
  const source = normalizeQueryString(stripQueryPrefix(queryString));
  if (!source || !QUERY_PAIR_START_RE.test(source)) return null;

  return parseQueryPairsDeep(source, maxDepth);
};

const parseFragmentValueDeep = (value: string, maxDepth: number): StructuredValue | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('#') && !trimmed.startsWith('/') && !trimmed.startsWith('?')) {
    return null;
  }

  const fragmentParamSource = getFragmentParamSource(trimmed);
  return fragmentParamSource ? parseUrlQueryStringDeep(fragmentParamSource, maxDepth) : null;
};

const parseQueryPairsDeep = (queryString: string, maxDepth: number): StructuredValue => {
  const singleRawUrlParam = getSingleRawUrlParam(queryString);
  if (singleRawUrlParam) {
    return {
      [singleRawUrlParam.key]: decodeNestedParamValue(singleRawUrlParam.value, maxDepth - 1),
    };
  }

  const result: QueryParamContainer = {};
  splitQueryPairs(queryString).forEach(pair => {
    const equalIndex = pair.indexOf('=');
    if (equalIndex <= 0) return;

    const key = decodeQueryComponent(pair.slice(0, equalIndex));
    const value = decodeQueryValueComponent(pair.slice(equalIndex + 1));
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
    const url = createUrl(urlString);
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

  const fragmentValue = parseFragmentValueDeep(value, maxDepth - 1);
  if (fragmentValue !== null) {
    return fragmentValue;
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
export function deepDecodeScheme(input: string, maxDepth: number = DEFAULT_SCHEME_DECODE_MAX_DEPTH): SchemeDecodeResult {
  const layers: DecodeLayer[] = [];
  let current = input;
  let depth = 0;
  let schemeInfo: SchemeDecodeResult['schemeInfo'];
  let placeholders: SchemePlaceholder[] = [];
  let warnings: SchemeDecodeWarning[] | undefined;

  while (depth < maxDepth) {
    const jsonStringPayload = tryParseJsonStringPayload(current);
    if (jsonStringPayload !== null) {
      layers.push({
        type: 'json',
        before: current,
        description: 'JSON 字符串字面量解析',
      });
      current = jsonStringPayload;
      depth++;
      continue;
    }

    const escapedSlashPayload = tryNormalizeJsonEscapedSlashPayload(current);
    if (escapedSlashPayload !== null) {
      layers.push({
        type: 'json-escaped-slash',
        before: current,
        description: 'JSON 斜杠转义还原',
      });
      current = escapedSlashPayload;
      depth++;
      continue;
    }

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
            description: isDecodableLogFieldParamString(before)
              ? '日志字段 CMD 递归解析'
              : isDecodablePrefixedQueryString(before)
                ? '日志前缀 CMD 参数递归解析'
                : 'CMD 参数递归解析',
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
        const decodedResult = decodeBase64WithMeta(current);
        if (decodedResult && decodedResult.decoded !== current && decodedResult.decoded.length > 0) {
          layers.push({
            type: 'base64',
            before,
            description: decodedResult.reversible ? 'Base64 Decode' : 'Base64 JSON 片段解析',
            reversible: decodedResult.reversible,
          });
          current = decodedResult.decoded;
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
            reversible: false,
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
      const parsed = JSON.parse(current) as StructuredValue;
      // 独立 Scheme 面板也可能直接粘贴整段 response，这里复用参数递归解析能力展开内部 CMD/Scheme。
      const structuredState = createDecodeStructuredState();
      const decodedParsed = decodeStructuredValue(parsed, maxDepth, structuredState);
      finalDecoded = JSON.stringify(decodedParsed, null, 2);
      placeholders = collectRuntimePlaceholders(decodedParsed);
      warnings = buildDecodeStructuredWarnings(structuredState);
    } catch {
      // 保持原样
    }
  } else if (isRuntimePlaceholder(current)) {
    placeholders = [{
      path: '$',
      value: current.trim(),
      description: getRuntimePlaceholderDescription(current),
    }];
  }

  return {
    original: input,
    decoded: finalDecoded,
    layers,
    isJson,
    placeholders,
    warnings,
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

interface StructuredQueryRootStyle {
  objectStyle: 'dot' | 'bracket';
  useEmptyArray: boolean;
}

const getStructuredQueryRootStyles = (queryString: string): Map<string, StructuredQueryRootStyle> => {
  const styles = new Map<string, StructuredQueryRootStyle>();

  splitQueryPairs(queryString).forEach(pair => {
    const equalIndex = pair.indexOf('=');
    if (equalIndex <= 0) return;

    const key = decodeQueryComponent(pair.slice(0, equalIndex));
    if (!key.includes('.') && !key.includes('[')) return;

    const segments = parseStructuredQueryKey(key);
    const root = segments[0];
    if (typeof root !== 'string') return;

    const existing = styles.get(root);
    const hasDotStyle = key.includes('.');
    styles.set(root, {
      objectStyle: existing?.objectStyle === 'dot' || hasDotStyle ? 'dot' : 'bracket',
      useEmptyArray: Boolean(existing?.useEmptyArray || key.includes('[]')),
    });
  });

  return styles;
};

const appendStructuredQueryValue = (
  params: URLSearchParams,
  key: string,
  value: unknown,
  style: StructuredQueryRootStyle
) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const childKey = style.useEmptyArray && !isPlainObject(item) && !Array.isArray(item)
        ? `${key}[]`
        : `${key}[${index}]`;
      appendStructuredQueryValue(params, childKey, item, style);
    });
    return;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([childKey, childValue]) => {
      const nextKey = style.objectStyle === 'dot'
        ? `${key}.${childKey}`
        : `${key}[${childKey}]`;
      appendStructuredQueryValue(params, nextKey, childValue, style);
    });
    return;
  }

  params.append(key, stringifyParamValue(value));
};

const buildQueryStringFromObject = (
  value: Record<string, unknown>,
  originalQueryString: string = ''
): string => {
  const params = new URLSearchParams();
  const structuredRootStyles = getStructuredQueryRootStyles(originalQueryString);

  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) continue;

    const structuredStyle = structuredRootStyles.get(key);
    if (structuredStyle && (Array.isArray(item) || isPlainObject(item))) {
      appendStructuredQueryValue(params, key, item, structuredStyle);
    } else if (Array.isArray(item)) {
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
    const url = createUrl(originalUrl);
    const hasQueryParams = Boolean(url.search);
    const hashParamSource = getFragmentParamSource(url.hash) || '';
    const hasHashParams = Boolean(hashParamSource);

    if (hasQueryParams && hasHashParams) {
      // query 与 hash 同时存在时，解析结果用 _hash 承载 hash route 参数。
      const { _hash: hashParams, ...queryParams } = editedParams;
      url.search = buildQueryStringFromObject(queryParams, url.search);
      url.hash = replaceHashParams(
        url.hash,
        buildQueryStringFromObject(isPlainObject(hashParams) ? hashParams : {}, hashParamSource)
      );
      return stringifyUrlForOriginalShape(url, originalUrl);
    }

    if (hasHashParams) {
      url.hash = replaceHashParams(url.hash, buildQueryStringFromObject(editedParams, hashParamSource));
      return stringifyUrlForOriginalShape(url, originalUrl);
    }

    url.search = buildQueryStringFromObject(editedParams, url.search);
    return stringifyUrlForOriginalShape(url, originalUrl);
  } catch {
    return content;
  }
};

const encodeSingleRawUrlParamContent = (
  editedParams: Record<string, unknown>,
  originalQueryString: string
): string | null => {
  const singleRawUrlParam = getSingleRawUrlParam(originalQueryString);
  if (!singleRawUrlParam) return null;

  const keys = Object.keys(editedParams);
  if (keys.length !== 1 || !Object.prototype.hasOwnProperty.call(editedParams, singleRawUrlParam.key)) {
    return null;
  }

  const editedUrlParams = editedParams[singleRawUrlParam.key];
  if (!isPlainObject(editedUrlParams)) return null;

  const rebuiltUrl = encodeUrlLayerContent(JSON.stringify(editedUrlParams), singleRawUrlParam.value);
  return `${singleRawUrlParam.rawKey}=${rebuiltUrl}`;
};

const wrapLogFieldValue = (value: string, quote?: '"' | "'"): string => {
  if (quote === '"') return JSON.stringify(value);
  if (quote === "'") return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  return value;
};

const formatLogFieldSeparator = (delimiter: LogFieldParam['delimiter']): string => (
  delimiter === '=' || delimiter === '=>' || delimiter === '->' ? ` ${delimiter} ` : `${delimiter} `
);

const encodeSingleLogFieldParamContent = (
  editedParams: Record<string, unknown>,
  originalQueryString: string
): string | null => {
  const logFieldParam = parseLogFieldParamString(originalQueryString);
  if (!logFieldParam) return null;

  const keys = Object.keys(editedParams);
  if (keys.length !== 1 || !Object.prototype.hasOwnProperty.call(editedParams, logFieldParam.key)) {
    return null;
  }

  const nestedDecoded = deepDecodeScheme(logFieldParam.value);
  const editedValue = editedParams[logFieldParam.key];
  const editedContent = isPlainObject(editedValue) || Array.isArray(editedValue)
    ? JSON.stringify(editedValue)
    : stringifyParamValue(editedValue);
  const encodedValue = encodeWithLayers(editedContent, nestedDecoded.layers);

  const suffix = logFieldParam.trailingComma ? ',' : '';
  return `${logFieldParam.prefix || ''}${logFieldParam.rawKey}${formatLogFieldSeparator(logFieldParam.delimiter)}${wrapLogFieldValue(encodedValue, logFieldParam.quote)}${suffix}`;
};

const encodePrefixedQueryStringContent = (
  editedParams: Record<string, unknown>,
  originalQueryString: string
): string | null => {
  const prefixedQueryString = getPrefixedQueryString(originalQueryString);
  if (!prefixedQueryString) return null;

  const encodedQueryString = encodeSingleRawUrlParamContent(editedParams, prefixedQueryString.queryString) ||
    buildQueryStringFromObject(editedParams, prefixedQueryString.queryString);

  return `${prefixedQueryString.prefix}${encodedQueryString}`;
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

    if (layer.reversible === false) {
      return layer.before;
    }
    
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
          if (isPlainObject(parsed)) {
            result = encodeSingleLogFieldParamContent(parsed, layer.before) ||
              encodeSingleRawUrlParamContent(parsed, layer.before) ||
              encodePrefixedQueryStringContent(parsed, layer.before) ||
              buildQueryStringFromObject(parsed, layer.before);
          }
        } catch {
          // 保持原样
        }
        break;
      case 'json':
        result = JSON.stringify(result);
        break;
      case 'json-escaped-slash':
        result = result.replace(/\//g, '\\/');
        break;
    }
  }
  
  return result;
}
