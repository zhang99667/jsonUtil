import { normalizeJsonEscapedSlashes } from './schemeEscapedPayloads';
import type { SchemeCommandSourceInfo, SchemeMetadataSourceShape } from './schemeMetadataSourceTypes';
import { getUrlResourceSchemaFromUrl } from './schemeUrlResourceSchema';
import { detectSchemeType, hasUrlEncoding, isActionableSchemeUrl, urlDecode } from './schemeUtils';

const SCHEME_URL_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;

export const normalizeSchemeMetadataSourceString = (value: string): string => {
  let current = normalizeJsonEscapedSlashes(value.trim());

  for (let depth = 0; depth < 3 && hasUrlEncoding(current); depth += 1) {
    if (detectSchemeType(current) !== 'url-encoded') break;

    const decoded = urlDecode(current);
    if (decoded === current) break;
    current = decoded;
  }

  return current;
};

const getNormalizedSchemeCommandSchema = (source: string): string | undefined => {
  if (!SCHEME_URL_RE.test(source) || !isActionableSchemeUrl(source)) return undefined;
  return getUrlResourceSchemaFromUrl(source);
};

export const getSchemeCommandSchemaFromUrl = (value: string): string | undefined => (
  getNormalizedSchemeCommandSchema(normalizeSchemeMetadataSourceString(value))
);

export const getSchemeCommandSourceInfo = (
  sourceShape: SchemeMetadataSourceShape | undefined,
): SchemeCommandSourceInfo | null => {
  if (typeof sourceShape !== 'string') return null;

  const source = normalizeSchemeMetadataSourceString(sourceShape);
  const sourceType = detectSchemeType(source);
  if (sourceType === 'url') {
    if (!isActionableSchemeUrl(source)) return null;

    const cmdSchema = getUrlResourceSchemaFromUrl(source);
    return {
      ...(cmdSchema ? { cmdSchema } : {}),
      source,
    };
  }

  return sourceType === 'query-string' ? { source } : null;
};

export const getSchemeCommandSchemaFromSource = (
  source?: string,
): string | undefined => {
  if (!source) return undefined;

  const normalized = normalizeSchemeMetadataSourceString(source);
  return detectSchemeType(normalized) === 'url'
    ? getNormalizedSchemeCommandSchema(normalized)
    : undefined;
};
