export const AI_ERROR_DETAIL_REDACTION_PLACEHOLDER = '[已隐藏敏感信息]';
export const AI_ERROR_DETAIL_MAX_LENGTH = 240;

const AI_SENSITIVE_FIELD_NAME_PATTERN = `(?:${[
  String.raw`api[_-]?key`,
  'apikey',
  'akey',
  String.raw`access[_-]?token`,
  String.raw`refresh[_-]?token`,
  'secret',
  'password',
  'passwd',
  'token',
  'sign',
  'signature',
  'sig',
  'cookie',
  'auth',
  String.raw`device[_-]?id`,
  String.raw`android[_-]?id`,
  String.raw`imei(?:sum)?`,
  'idfa',
  String.raw`oaid(?:[_-]?(?:v|sum))?`,
  'cuid',
].join('|')})`;
const AI_SENSITIVE_QUOTED_FIELD_RE = new RegExp(
  String.raw`(${AI_SENSITIVE_FIELD_NAME_PATTERN}["']?\s*[:=]\s*)(["'])(?:\\.|(?!\2)[\s\S])*?\2`,
  'gi'
);
const AI_SENSITIVE_UNQUOTED_FIELD_RE = new RegExp(
  String.raw`(${AI_SENSITIVE_FIELD_NAME_PATTERN}["']?\s*[:=]\s*["']?)(?:(?:Bearer|Basic)\s+)?([^"',\s}&]+)`,
  'gi'
);

export const redactAiErrorDetail = (value: string): string => (
  value
    .replace(
      /(Authorization\s*["']?\s*[:=]\s*["']?(?:Bearer|Basic)\s+)([^\s,;"}]+)/gi,
      `$1${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`
    )
    .replace(
      /\b(Bearer\s+)([A-Za-z0-9._~+/=-]{8,})/gi,
      `$1${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`
    )
    .replace(
      /(authorization["']?\s*[:=]\s*["']?)(?!Bearer\b|Basic\b)([^"',\s}&]+)/gi,
      `$1${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`
    )
    .replace(
      AI_SENSITIVE_QUOTED_FIELD_RE,
      `$1$2${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}$2`
    )
    .replace(
      AI_SENSITIVE_UNQUOTED_FIELD_RE,
      `$1${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`
    )
    .replace(
      /\bsk-[A-Za-z0-9_-]{8,}\b/g,
      AI_ERROR_DETAIL_REDACTION_PLACEHOLDER
    )
);

export const formatAiErrorDetailSummary = (
  value: string,
  maxLength = AI_ERROR_DETAIL_MAX_LENGTH
): string => {
  const redacted = redactAiErrorDetail(value.trim());
  return redacted.length > maxLength
    ? `${redacted.slice(0, maxLength)}...`
    : redacted;
};
