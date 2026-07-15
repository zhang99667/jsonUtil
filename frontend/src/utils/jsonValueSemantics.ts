import { base64Decode, decodeJwt, isBase64, isJwt } from './schemeUtils';
import { urlDecode } from './schemeQueryDecoding';

export type JsonStringSemanticKind =
  | 'url'
  | 'scheme'
  | 'jwt'
  | 'base64'
  | 'email'
  | 'phone'
  | 'uuid'
  | 'timestamp'
  | 'hash'
  | 'date'
  | 'date-time'
  | 'color'
  | 'resource-image'
  | 'resource-video'
  | 'resource-lottie'
  | 'resource-audio'
  | 'resource-package';

export interface JsonStringSemanticHint {
  kind: JsonStringSemanticKind;
  label: string;
  detail: string;
}

export interface JsonStringSemanticContext {
  path?: string;
  keyLabel?: string;
}

const ACTIONABLE_SEMANTIC_HINT_KINDS: ReadonlySet<JsonStringSemanticKind> = new Set([
  'url',
  'scheme',
  'jwt',
  'base64',
  'resource-image',
  'resource-video',
  'resource-lottie',
  'resource-audio',
  'resource-package',
]);

const URL_PROTOCOL_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;
const PROTOCOL_RELATIVE_URL_RE = /^\/\/[^\s/$.?#].[^\s]*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CONTEXT_RE = /(?:phone|mobile|tel|telephone|call|手机号|电话|号码)/i;
const CHINA_MOBILE_PHONE_RE = /^(?:\+?86[-\s]?)?1[3-9]\d{9}$/;
const SERVICE_PHONE_RE = /^(?:400|800)-?\d{3}-?\d{4}$/;
const LANDLINE_PHONE_RE = /^0\d{2,3}-?\d{7,8}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX_HASH_RE = /^(?=[0-9a-f]*[a-f])[0-9a-f]{32}(?:[0-9a-f]{8})?(?:[0-9a-f]{24})?$/i;
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})?$/;
const LOTTIE_RESOURCE_EXTENSION_RE = /\.(?:lottie)$/i;
const IMAGE_RESOURCE_EXTENSION_RE = /\.(?:apng|avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i;
const VIDEO_RESOURCE_EXTENSION_RE = /\.(?:mp4|m4v|mov|webm|avi|m3u8)$/i;
const AUDIO_RESOURCE_EXTENSION_RE = /\.(?:mp3|wav|aac|ogg|flac|m4a)$/i;
const PACKAGE_RESOURCE_EXTENSION_RE = /\.(?:apk|ipa|zip|rar|7z|tar|gz|tgz)$/i;
const LOTTIE_CONTEXT_RE = /lottie/i;
const TIMESTAMP_CONTEXT_KEY_RE = /(?:timestamp|time|created|updated|ctime|mtime|时间|日期)/i;
const TIMESTAMP_CONTEXT_EXACT_KEY_RE = /^(?:ts|tm)$/i;

const hasTimestampContext = (context?: JsonStringSemanticContext): boolean => {
  const key = context?.keyLabel?.trim() || '';
  const source = `${key} ${context?.path || ''}`.trim();
  return TIMESTAMP_CONTEXT_EXACT_KEY_RE.test(key) || TIMESTAMP_CONTEXT_KEY_RE.test(source);
};

const isValidDateOnly = (value: string): boolean => {
  const match = value.match(DATE_ONLY_RE);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
};

const truncateSemanticDetail = (value: string, maxLength = 80): string => (
  value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`
);

const formatKeySummary = (keys: string[], emptyLabel = '无字段'): string => {
  if (keys.length === 0) return emptyLabel;
  const visibleKeys = keys.slice(0, 4).join(', ');
  return keys.length > 4 ? `${visibleKeys} +${keys.length - 4}` : visibleKeys;
};

const summarizeDecodedPayload = (decoded: string): string => {
  try {
    const parsed: unknown = JSON.parse(decoded);
    if (Array.isArray(parsed)) return `JSON 数组 ${parsed.length} 项`;
    if (parsed && typeof parsed === 'object') {
      return `JSON: ${formatKeySummary(Object.keys(parsed))}`;
    }
  } catch {
    // 非 JSON 的可读 Base64 只展示长度，避免把解码明文直接暴露在结构详情区。
  }

  return `文本 ${decoded.length} 字符`;
};

const getJwtSemanticHint = (value: string): JsonStringSemanticHint | null => {
  if (!isJwt(value)) return null;
  const decoded = decodeJwt(value);
  if (!decoded) return null;

  const detail = [
    `payload: ${formatKeySummary(Object.keys(decoded.payload))}`,
    `header: ${formatKeySummary(Object.keys(decoded.header))}`,
  ].join(' · ');

  return {
    kind: 'jwt',
    label: 'JWT',
    detail: truncateSemanticDetail(detail),
  };
};

const getBase64SemanticHint = (value: string): JsonStringSemanticHint | null => {
  if (!isBase64(value)) return null;
  const decoded = base64Decode(value);
  if (decoded === value) return null;

  return {
    kind: 'base64',
    label: 'Base64',
    detail: truncateSemanticDetail(summarizeDecodedPayload(decoded)),
  };
};

const maskPhoneDetail = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  const localDigits = digits.startsWith('86') && digits.length === 13 ? digits.slice(2) : digits;

  return localDigits.length === 11
    ? `${localDigits.slice(0, 3)}****${localDigits.slice(-4)}`
    : value;
};

const hasPhoneContext = (context?: JsonStringSemanticContext): boolean => {
  const source = `${context?.keyLabel || ''} ${context?.path || ''}`.trim();
  return Boolean(source) && PHONE_CONTEXT_RE.test(source);
};

const getPhoneSemanticHint = (
  value: string,
  context?: JsonStringSemanticContext
): JsonStringSemanticHint | null => {
  if (!hasPhoneContext(context)) return null;
  if (!CHINA_MOBILE_PHONE_RE.test(value) && !SERVICE_PHONE_RE.test(value) && !LANDLINE_PHONE_RE.test(value)) {
    return null;
  }

  return {
    kind: 'phone',
    label: '电话',
    detail: maskPhoneDetail(value),
  };
};

const getTimestampSemanticHint = (
  value: string,
  context?: JsonStringSemanticContext
): JsonStringSemanticHint | null => {
  if (!hasTimestampContext(context)) return null;
  if (!/^(?:\d{10}|\d{13})$/.test(value)) return null;

  const timestamp = value.length === 10 ? Number(value) * 1000 : Number(value);
  const lowerBound = Date.UTC(2000, 0, 1);
  const upperBound = Date.UTC(2100, 0, 1);
  if (!Number.isSafeInteger(timestamp) || timestamp < lowerBound || timestamp > upperBound) return null;

  return {
    kind: 'timestamp',
    label: '时间戳',
    detail: `${value.length === 10 ? '秒' : '毫秒'} ${new Date(timestamp).toISOString()}`,
  };
};

const getHashSemanticHint = (value: string): JsonStringSemanticHint | null => {
  if (!HEX_HASH_RE.test(value)) return null;

  const hashType = value.length === 32
    ? 'MD5 形态'
    : value.length === 40
      ? 'SHA-1 形态'
      : 'SHA-256 形态';

  return {
    kind: 'hash',
    label: '哈希',
    detail: `${hashType} · ${value.length} hex`,
  };
};

const getUrlSemanticHint = (value: string): JsonStringSemanticHint | null => {
  if (/\s/.test(value)) return null;

  const source = PROTOCOL_RELATIVE_URL_RE.test(value)
    ? `https:${value}`
    : value;

  if (!URL_PROTOCOL_RE.test(source)) return null;

  try {
    const url = new URL(source);
    const protocol = url.protocol.replace(/:$/, '');
    const isHttpUrl = protocol === 'http' || protocol === 'https';
    const path = `${url.pathname || ''}${url.hash ? '#...' : ''}`;
    const detail = truncateSemanticDetail(`${url.host}${path}`);

    return {
      kind: isHttpUrl ? 'url' : 'scheme',
      label: isHttpUrl ? 'URL' : 'Scheme',
      detail: detail || protocol,
    };
  } catch {
    return null;
  }
};

const getUrlForSemanticScan = (value: string): URL | null => {
  const source = PROTOCOL_RELATIVE_URL_RE.test(value)
    ? `https:${value}`
    : value;

  if (!URL_PROTOCOL_RE.test(source)) return null;

  try {
    return new URL(source);
  } catch {
    return null;
  }
};

const getResourceDetail = (url: URL): string => {
  const segments = url.pathname.split('/').filter(Boolean);
  const detail = segments.at(-1) || url.hostname || '资源';
  return urlDecode(detail);
};

const getResourceSemanticHint = (
  value: string,
  context?: JsonStringSemanticContext
): JsonStringSemanticHint | null => {
  const url = getUrlForSemanticScan(value);
  if (!url) return null;

  const pathname = url.pathname.toLowerCase();
  const contextText = `${context?.keyLabel || ''} ${context?.path || ''}`;
  const detail = getResourceDetail(url);

  if (
    LOTTIE_RESOURCE_EXTENSION_RE.test(pathname) ||
    ((pathname.endsWith('.json') || pathname.endsWith('.zip')) && LOTTIE_CONTEXT_RE.test(contextText))
  ) {
    return { kind: 'resource-lottie', label: 'Lottie', detail };
  }
  if (VIDEO_RESOURCE_EXTENSION_RE.test(pathname)) {
    return { kind: 'resource-video', label: '视频资源', detail };
  }
  if (IMAGE_RESOURCE_EXTENSION_RE.test(pathname)) {
    return { kind: 'resource-image', label: '图片资源', detail };
  }
  if (AUDIO_RESOURCE_EXTENSION_RE.test(pathname)) {
    return { kind: 'resource-audio', label: '音频资源', detail };
  }
  if (PACKAGE_RESOURCE_EXTENSION_RE.test(pathname)) {
    return { kind: 'resource-package', label: '包资源', detail };
  }

  return null;
};

export const getJsonStringSemanticHints = (
  value: unknown,
  context?: JsonStringSemanticContext
): JsonStringSemanticHint[] => {
  if (typeof value !== 'string') return [];

  const text = value.trim();
  if (!text) return [];

  const hints: JsonStringSemanticHint[] = [];
  const urlHint = getUrlSemanticHint(text);
  if (urlHint) hints.push(urlHint);
  const resourceHint = getResourceSemanticHint(text, context);
  if (resourceHint) hints.push(resourceHint);
  const jwtHint = getJwtSemanticHint(text);
  if (jwtHint) hints.push(jwtHint);
  const base64Hint = jwtHint ? null : getBase64SemanticHint(text);
  if (base64Hint) hints.push(base64Hint);
  if (EMAIL_RE.test(text)) {
    hints.push({
      kind: 'email',
      label: '邮箱',
      detail: text,
    });
  }
  const phoneHint = getPhoneSemanticHint(text, context);
  if (phoneHint) hints.push(phoneHint);
  if (UUID_RE.test(text)) {
    hints.push({
      kind: 'uuid',
      label: 'UUID',
      detail: text.toLowerCase(),
    });
  }
  const timestampHint = getTimestampSemanticHint(text, context);
  if (timestampHint) hints.push(timestampHint);
  const hashHint = getHashSemanticHint(text);
  if (hashHint) hints.push(hashHint);
  if (DATE_TIME_RE.test(text) && !Number.isNaN(Date.parse(text))) {
    hints.push({
      kind: 'date-time',
      label: '日期时间',
      detail: text.replace('T', ' '),
    });
  } else if (isValidDateOnly(text)) {
    hints.push({
      kind: 'date',
      label: '日期',
      detail: text,
    });
  }
  if (HEX_COLOR_RE.test(text)) {
    hints.push({
      kind: 'color',
      label: '颜色',
      detail: text.toUpperCase(),
    });
  }
  return hints;
};

export const isJsonStringSemanticHintActionable = (hint: JsonStringSemanticHint): boolean => (
  ACTIONABLE_SEMANTIC_HINT_KINDS.has(hint.kind)
);
