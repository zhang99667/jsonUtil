export type JsonStringSemanticKind = 'url' | 'scheme' | 'email' | 'date' | 'date-time' | 'color';

export interface JsonStringSemanticHint {
  kind: JsonStringSemanticKind;
  label: string;
  detail: string;
}

const URL_PROTOCOL_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;
const PROTOCOL_RELATIVE_URL_RE = /^\/\/[^\s/$.?#].[^\s]*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

export const getJsonStringSemanticHints = (value: unknown): JsonStringSemanticHint[] => {
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
