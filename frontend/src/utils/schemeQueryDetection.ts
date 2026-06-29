import {
  QUERY_PAIR_DELIMITER_RE,
  QUERY_PAIR_START_RE,
  normalizeQueryString,
  stripQueryPrefix,
} from './schemeQuerySyntax';
import {
  findSchemePrefixedQueryString,
  type SchemePrefixedQueryString,
} from './schemePrefixedQuery';

export interface SchemeQueryDetectionOptions {
  isKnownParamName: (key: string) => boolean;
  isDecodableValue: (value: string) => boolean;
}

export const isSchemeQueryStringFormat = (value: string): boolean => {
  const trimmed = value.trim();
  const source = normalizeQueryString(stripQueryPrefix(trimmed));

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return false;
  if (!QUERY_PAIR_START_RE.test(source)) return false;

  return QUERY_PAIR_DELIMITER_RE.test(source);
};

export const isDecodableSchemeQueryString = (
  value: string,
  options: SchemeQueryDetectionOptions
): boolean => {
  const trimmed = value.trim();
  const source = normalizeQueryString(stripQueryPrefix(trimmed));

  if (!source || /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(source)) return false;
  if (!QUERY_PAIR_START_RE.test(source)) return false;
  if (QUERY_PAIR_DELIMITER_RE.test(source)) return true;

  const equalIndex = source.indexOf('=');
  const key = source.slice(0, equalIndex);
  const queryValue = source.slice(equalIndex + 1);
  return options.isKnownParamName(key) && options.isDecodableValue(queryValue);
};

export const getSchemePrefixedQueryString = (
  source: string,
  options: SchemeQueryDetectionOptions
): SchemePrefixedQueryString | null => {
  const trimmed = source.trim();
  if (isDecodableSchemeQueryString(trimmed, options)) return null;

  const prefixedQuery = findSchemePrefixedQueryString(trimmed);
  if (!prefixedQuery) return null;

  const queryString = normalizeQueryString(stripQueryPrefix(prefixedQuery.queryString));
  if (!queryString || !isDecodableSchemeQueryString(queryString, options)) return null;

  return {
    prefix: prefixedQuery.prefix,
    queryString,
  };
};

export const isDecodableSchemePrefixedQueryString = (
  source: string,
  options: SchemeQueryDetectionOptions
): boolean => getSchemePrefixedQueryString(source, options) !== null;
