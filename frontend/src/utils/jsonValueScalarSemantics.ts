import type {
  JsonStringSemanticContext,
  JsonStringSemanticHint,
} from './jsonValueSemantics';

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
const TIMESTAMP_CONTEXT_KEY_RE = /(?:timestamp|time|created|updated|ctime|mtime|时间|日期)/i;
const TIMESTAMP_CONTEXT_EXACT_KEY_RE = /^(?:ts|tm)$/i;

const getContextText = (context?: JsonStringSemanticContext): string => (
  `${context?.keyLabel || ''} ${context?.path || ''}`.trim()
);

const hasTimestampContext = (context?: JsonStringSemanticContext): boolean => {
  const key = context?.keyLabel?.trim() || '';
  return TIMESTAMP_CONTEXT_EXACT_KEY_RE.test(key)
    || TIMESTAMP_CONTEXT_KEY_RE.test(getContextText(context));
};

const isValidDateOnly = (value: string): boolean => {
  const match = value.match(DATE_ONLY_RE);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
};

const maskPhoneDetail = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  const localDigits = digits.startsWith('86') && digits.length === 13 ? digits.slice(2) : digits;

  return localDigits.length === 11
    ? `${localDigits.slice(0, 3)}****${localDigits.slice(-4)}`
    : value;
};

const getPhoneSemanticHint = (
  value: string,
  context?: JsonStringSemanticContext,
): JsonStringSemanticHint | null => {
  if (!PHONE_CONTEXT_RE.test(getContextText(context))) return null;
  if (!CHINA_MOBILE_PHONE_RE.test(value)
    && !SERVICE_PHONE_RE.test(value)
    && !LANDLINE_PHONE_RE.test(value)) {
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
  context?: JsonStringSemanticContext,
): JsonStringSemanticHint | null => {
  if (!hasTimestampContext(context) || !/^(?:\d{10}|\d{13})$/.test(value)) return null;

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

export const getJsonScalarSemanticHints = (
  value: string,
  context?: JsonStringSemanticContext,
): JsonStringSemanticHint[] => {
  const hints: JsonStringSemanticHint[] = [];

  if (EMAIL_RE.test(value)) {
    hints.push({ kind: 'email', label: '邮箱', detail: value });
  }
  const phoneHint = getPhoneSemanticHint(value, context);
  if (phoneHint) hints.push(phoneHint);
  if (UUID_RE.test(value)) {
    hints.push({ kind: 'uuid', label: 'UUID', detail: value.toLowerCase() });
  }
  const timestampHint = getTimestampSemanticHint(value, context);
  if (timestampHint) hints.push(timestampHint);
  const hashHint = getHashSemanticHint(value);
  if (hashHint) hints.push(hashHint);
  if (DATE_TIME_RE.test(value) && !Number.isNaN(Date.parse(value))) {
    hints.push({ kind: 'date-time', label: '日期时间', detail: value.replace('T', ' ') });
  } else if (isValidDateOnly(value)) {
    hints.push({ kind: 'date', label: '日期', detail: value });
  }
  if (HEX_COLOR_RE.test(value)) {
    hints.push({ kind: 'color', label: '颜色', detail: value.toUpperCase() });
  }

  return hints;
};
