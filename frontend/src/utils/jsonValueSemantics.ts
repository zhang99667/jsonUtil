import { base64Decode, decodeJwt, isBase64, isJwt } from './schemeUtils';
import { getResourcePathType } from './resourcePathType';
import { urlDecode } from './schemeQueryDecoding';
import { getJsonScalarSemanticHints } from './jsonValueScalarSemantics';
import { tryParseJsonValue } from './jsonValueGuards';

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
const LOTTIE_RESOURCE_EXTENSION_RE = /\.(?:lottie)$/i;
const LOTTIE_CONTEXT_RE = /lottie/i;

const truncateSemanticDetail = (value: string, maxLength = 80): string => (
  value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`
);

const formatKeySummary = (keys: string[], emptyLabel = '无字段'): string => {
  if (keys.length === 0) return emptyLabel;
  const visibleKeys = keys.slice(0, 4).join(', ');
  return keys.length > 4 ? `${visibleKeys} +${keys.length - 4}` : visibleKeys;
};

const summarizeDecodedPayload = (decoded: string): string => {
  const parsed = tryParseJsonValue(decoded);
  if (Array.isArray(parsed)) return `JSON 数组 ${parsed.length} 项`;
  if (parsed && typeof parsed === 'object') {
    return `JSON: ${formatKeySummary(Object.keys(parsed))}`;
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

const parseSemanticUrl = (value: string): URL | null => {
  if (/\s/.test(value)) return null;

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
  url: URL,
  context?: JsonStringSemanticContext
): JsonStringSemanticHint | null => {
  const pathname = url.pathname.toLowerCase();
  const contextText = `${context?.keyLabel || ''} ${context?.path || ''}`;
  const detail = getResourceDetail(url);
  const resourcePathType = getResourcePathType(pathname);

  if (
    LOTTIE_RESOURCE_EXTENSION_RE.test(pathname) ||
    ((pathname.endsWith('.json') || pathname.endsWith('.zip')) && LOTTIE_CONTEXT_RE.test(contextText))
  ) {
    return { kind: 'resource-lottie', label: 'Lottie', detail };
  }
  if (resourcePathType === 'video') {
    return { kind: 'resource-video', label: '视频资源', detail };
  }
  if (resourcePathType === 'image') {
    return { kind: 'resource-image', label: '图片资源', detail };
  }
  if (resourcePathType === 'audio') {
    return { kind: 'resource-audio', label: '音频资源', detail };
  }
  if (resourcePathType === 'package') {
    return { kind: 'resource-package', label: '包资源', detail };
  }

  return null;
};

const getUrlSemanticHints = (
  value: string,
  context?: JsonStringSemanticContext
): JsonStringSemanticHint[] => {
  const url = parseSemanticUrl(value);
  if (!url) return [];

  const protocol = url.protocol.replace(/:$/, '');
  const isHttpUrl = protocol === 'http' || protocol === 'https';
  const path = `${url.pathname || ''}${url.hash ? '#...' : ''}`;
  const hints: JsonStringSemanticHint[] = [{
    kind: isHttpUrl ? 'url' : 'scheme',
    label: isHttpUrl ? 'URL' : 'Scheme',
    detail: truncateSemanticDetail(`${url.host}${path}`) || protocol,
  }];
  const resourceHint = getResourceSemanticHint(url, context);
  if (resourceHint) hints.push(resourceHint);
  return hints;
};

export const getJsonStringSemanticHints = (
  value: unknown,
  context?: JsonStringSemanticContext
): JsonStringSemanticHint[] => {
  if (typeof value !== 'string') return [];

  const text = value.trim();
  if (!text) return [];

  const hints: JsonStringSemanticHint[] = [];
  hints.push(...getUrlSemanticHints(text, context));
  const jwtHint = getJwtSemanticHint(text);
  if (jwtHint) hints.push(jwtHint);
  const base64Hint = jwtHint ? null : getBase64SemanticHint(text);
  if (base64Hint) hints.push(base64Hint);
  hints.push(...getJsonScalarSemanticHints(text, context));
  return hints;
};

export const isJsonStringSemanticHintActionable = (hint: JsonStringSemanticHint): boolean => (
  ACTIONABLE_SEMANTIC_HINT_KINDS.has(hint.kind)
);
