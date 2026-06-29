export const isJsonString = (str: string): boolean => {
  const trimmed = str.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
};

export const normalizeLooseJsonCandidate = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;

  return trimmed
    .replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3')
    .replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*":)/g, '$1"$2$3')
    .replace(/'((?:\\.|[^'\\])*)'/g, (_, content: string) => (
      JSON.stringify(content.replace(/\\'/g, "'"))
    ))
    .replace(/,\s*([}\]])/g, '$1');
};

const HTML_JSON_QUOTE_ENTITY_RE = /&(?:quot|#34|#x22|apos|#39|#x27);/i;
const HTML_JSON_QUOTE_ENTITY_GLOBAL_RE = /&(?:quot|#34|#x22|apos|#39|#x27);/gi;

export const normalizeHtmlJsonQuoteCandidate = (value: string): string | null => {
  const trimmed = value.trim();
  if ((!trimmed.startsWith('{') && !trimmed.startsWith('[')) || !HTML_JSON_QUOTE_ENTITY_RE.test(trimmed)) {
    return null;
  }

  return trimmed.replace(HTML_JSON_QUOTE_ENTITY_GLOBAL_RE, entity => (
    entity.toLowerCase().includes('apos') ||
    entity.toLowerCase().includes('39') ||
    entity.toLowerCase().includes('x27')
      ? "'"
      : '"'
  ));
};

export const tryNormalizeHtmlJsonQuotePayload = (value: string): string | null => {
  const normalized = normalizeHtmlJsonQuoteCandidate(value);
  if (!normalized) return null;
  if (isJsonString(normalized)) return normalized;

  const looseJson = normalizeLooseJsonCandidate(normalized);
  return looseJson && isJsonString(looseJson) ? looseJson : null;
};

export const normalizeJsonEscapedQuoteCandidate = (value: string): string | null => {
  const trimmed = value.trim();
  if ((!trimmed.startsWith('{') && !trimmed.startsWith('[')) || !trimmed.includes('\\"')) {
    return null;
  }

  return trimmed.replace(/\\"/g, '"').replace(/\\\//g, '/');
};

export const tryNormalizeJsonEscapedQuotePayload = (value: string): string | null => {
  const normalized = normalizeJsonEscapedQuoteCandidate(value);
  if (!normalized) return null;
  if (isJsonString(normalized)) return normalized;

  const looseJson = normalizeLooseJsonCandidate(normalized);
  return looseJson && isJsonString(looseJson) ? looseJson : null;
};
