export type JsonStringSemanticKind =
  | 'url'
  | 'scheme'
  | 'email'
  | 'phone'
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

const URL_PROTOCOL_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;
const PROTOCOL_RELATIVE_URL_RE = /^\/\/[^\s/$.?#].[^\s]*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CONTEXT_RE = /(?:phone|mobile|tel|telephone|call|手机号|电话|号码)/i;
const CHINA_MOBILE_PHONE_RE = /^(?:\+?86[-\s]?)?1[3-9]\d{9}$/;
const SERVICE_PHONE_RE = /^(?:400|800)-?\d{3}-?\d{4}$/;
const LANDLINE_PHONE_RE = /^0\d{2,3}-?\d{7,8}$/;
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})?$/;
const LOTTIE_RESOURCE_EXTENSION_RE = /\.(?:lottie)$/i;
const IMAGE_RESOURCE_EXTENSION_RE = /\.(?:apng|avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i;
const VIDEO_RESOURCE_EXTENSION_RE = /\.(?:mp4|m4v|mov|webm|avi|m3u8)$/i;
const AUDIO_RESOURCE_EXTENSION_RE = /\.(?:mp3|wav|aac|ogg|flac|m4a)$/i;
const PACKAGE_RESOURCE_EXTENSION_RE = /\.(?:apk|ipa|zip|rar|7z|tar|gz|tgz)$/i;
const LOTTIE_CONTEXT_RE = /lottie/i;

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
  return decodeURIComponent(segments.at(-1) || url.hostname || '资源');
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
  if (EMAIL_RE.test(text)) {
    hints.push({
      kind: 'email',
      label: '邮箱',
      detail: text,
    });
  }
  const phoneHint = getPhoneSemanticHint(text, context);
  if (phoneHint) hints.push(phoneHint);
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
