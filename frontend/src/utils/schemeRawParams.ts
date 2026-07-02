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

interface SingleRawParamParts {
  source: string;
  rawKey: string;
  key: string;
  rawValue: string;
}

const getSingleRawParamParts = (
  queryString: string,
  options: SchemeRawParamOptions
): SingleRawParamParts | null => {
  const source = normalizeQueryString(stripQueryPrefix(queryString));

  const equalIndex = source.indexOf('=');
  if (equalIndex <= 0) return null;

  const rawKey = source.slice(0, equalIndex);
  const key = options.decodeKey(rawKey);
  if (!key || !options.isKnownParamName(key)) return null;

  return {
    source,
    rawKey,
    key,
    rawValue: source.slice(equalIndex + 1),
  };
};

export const getSingleRawStructuredParam = (
  queryString: string,
  options: SchemeRawParamOptions
): SingleRawStructuredParam | null => {
  const parts = getSingleRawParamParts(queryString, options);
  if (!parts || !QUERY_PAIR_DELIMITER_RE.test(parts.source)) return null;

  const value = options.decodeValue(parts.rawValue);
  return options.isJsonValue(value) ? { key: parts.key, value } : null;
};

export const getSingleRawUrlParam = (
  queryString: string,
  options: SchemeRawParamOptions
): SingleRawUrlParam | null => {
  const parts = getSingleRawParamParts(queryString, options);
  if (!parts) return null;

  if (!options.isUrlValue(parts.rawValue)) return null;

  const value = options.decodeValue(parts.rawValue);
  return options.isUrlValue(value) ? { rawKey: parts.rawKey, key: parts.key, value } : null;
};
