import {
  QUERY_KEY_PATTERN,
  QUERY_PAIR_START_RE,
} from './schemeQueryPatterns';

const SEMICOLON_QUERY_DELIMITER_RE = new RegExp(`;(?=${QUERY_KEY_PATTERN}=)`, 'g');
const COMMA_QUERY_DELIMITER_RE = new RegExp(`,\\s*(?=${QUERY_KEY_PATTERN}=)`, 'g');
const HTML_EQUALS_RE = /&(?:equals|#61|#x3d);/gi;
const HTML_QUERY_DELIMITER_RE = new RegExp(`&(?:amp|#38|#x26);(?=${QUERY_KEY_PATTERN}=)`, 'gi');
const UNICODE_EQUALS_RE = /\\u003d/gi;
const UNICODE_AMP_QUERY_DELIMITER_RE = new RegExp(`\\\\u0026(?=${QUERY_KEY_PATTERN}=)`, 'gi');
const ESCAPED_LINE_QUERY_DELIMITER_RE = new RegExp(`(?:\\\\r\\\\n|\\\\n)[ \\t]*(?=${QUERY_KEY_PATTERN}=)`, 'g');
const LINE_QUERY_DELIMITER_RE = new RegExp(`\\r?\\n[ \\t]*(?=${QUERY_KEY_PATTERN}=)`, 'g');

export const normalizeQueryString = (source: string): string => (
  source.trim()
    .replace(HTML_EQUALS_RE, '=')
    .replace(HTML_QUERY_DELIMITER_RE, '&')
    .replace(UNICODE_EQUALS_RE, '=')
    .replace(UNICODE_AMP_QUERY_DELIMITER_RE, '&')
    .replace(SEMICOLON_QUERY_DELIMITER_RE, '&')
    .replace(COMMA_QUERY_DELIMITER_RE, '&')
    .replace(ESCAPED_LINE_QUERY_DELIMITER_RE, '&')
    .replace(LINE_QUERY_DELIMITER_RE, '&')
);

export const stripQueryPrefix = (source: string): string => (
  source.trim().replace(/^\?/, '').replace(/^&+/, '')
);

export const looksLikeQueryString = (source: string): boolean => {
  const normalized = normalizeQueryString(stripQueryPrefix(source));
  return QUERY_PAIR_START_RE.test(normalized);
};
