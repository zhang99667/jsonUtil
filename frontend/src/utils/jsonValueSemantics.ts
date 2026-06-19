export type JsonStringSemanticKind =
  | 'url'
  | 'scheme'
  | 'email'
  | 'phone'
  | 'date'
  | 'date-time'
  | 'color';

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
