import {
  QUERY_PAIR_DELIMITER_RE,
  normalizeQueryString,
  stripQueryPrefix,
} from './schemeQuerySyntax';

export interface SingleRawUrlParam {
  rawKey: string;
  key: string;
  value: string;
}

export interface SingleRawStructuredParam {
  key: string;
  value: string;
}

export interface SchemeRawParamOptions {
  decodeKey: (value: string) => string;
  decodeValue: (value: string) => string;
  isKnownParamName: (key: string) => boolean;
  isUrlValue: (value: string) => boolean;
  isJsonValue: (value: string) => boolean;
}

export const getSingleRawStructuredParam = (
  queryString: string,
  options: SchemeRawParamOptions
): SingleRawStructuredParam | null => {
  const source = normalizeQueryString(stripQueryPrefix(queryString));
  if (!QUERY_PAIR_DELIMITER_RE.test(source)) return null;

  const equalIndex = source.indexOf('=');
  if (equalIndex <= 0) return null;

  const key = options.decodeKey(source.slice(0, equalIndex));
  if (!key || !options.isKnownParamName(key)) return null;

  const value = options.decodeValue(source.slice(equalIndex + 1));
  return options.isJsonValue(value) ? { key, value } : null;
};

export const getSingleRawUrlParam = (
  queryString: string,
  options: SchemeRawParamOptions
): SingleRawUrlParam | null => {
  const source = normalizeQueryString(stripQueryPrefix(queryString));

  const equalIndex = source.indexOf('=');
  if (equalIndex <= 0) return null;

  const rawKey = source.slice(0, equalIndex);
  const key = options.decodeKey(rawKey);
  if (!key || !options.isKnownParamName(key)) return null;

  const rawValue = source.slice(equalIndex + 1);
  if (!options.isUrlValue(rawValue)) return null;

  const value = options.decodeValue(rawValue);
  return options.isUrlValue(value) ? { rawKey, key, value } : null;
};
