import {
  createUrl,
  isHttpSchemeProtocol,
  normalizeJsonUrlEscapes,
} from './schemeUrlShapes';
import { hasActionableHttpUrlParams } from './schemeNestedCommandExposure';

export type SchemeExposureType =
  | 'url'
  | 'query-string'
  | 'url-encoded'
  | 'base64'
  | 'jwt'
  | 'json'
  | 'plain';

export interface SchemeExposureOptions {
  base64Decode: (value: string) => string;
  decodeQueryKey: (value: string) => string;
  decodeQueryValue: (value: string) => string;
  detectSchemeType: (value: string) => SchemeExposureType;
  getFragmentParamSource: (hash: string) => string | null;
  hasUrlEncoding: (value: string) => boolean;
  isBase64: (value: string) => boolean;
  isDecodableFragmentParamString: (value: string) => boolean;
  isDecodablePrefixedQueryString: (value: string) => boolean;
  isDecodableQueryString: (value: string) => boolean;
  isJsonString: (value: string) => boolean;
  isJwt: (value: string) => boolean;
  isRuntimePlaceholder: (value: string) => boolean;
  isUrl: (value: string) => boolean;
  looksLikeStructuredPayload: (value: string) => boolean;
  tryParseJsonStringPayload: (value: string) => string | null;
  urlDecode: (value: string) => string;
}

const ACTIONABLE_URL_MAX_DEPTH = 5;

const createNestedCommandExposureOptions = (options: SchemeExposureOptions) => ({
  ...options,
  maxDepth: ACTIONABLE_URL_MAX_DEPTH,
  isActionableUrl: (value: string, depth: number) => (
    isActionableSchemeUrlWithOptions(value, options, depth)
  ),
  shouldExposeNormalizedValue: (value: string, depth: number) => (
    shouldExposeNormalizedSchemeValue(value, depth, options)
  ),
});

const shouldExposeNormalizedSchemeValue = (
  value: string,
  depth: number,
  options: SchemeExposureOptions
): boolean => {
  if (depth > ACTIONABLE_URL_MAX_DEPTH) return false;

  const trimmed = value.trim();
  const type = options.detectSchemeType(trimmed);
  if (type === 'plain' || type === 'json') return false;
  if (type === 'url') return isActionableSchemeUrlWithOptions(trimmed, options, depth + 1);

  if (type === 'url-encoded') {
    const decoded = options.urlDecode(trimmed);
    return decoded !== trimmed && shouldExposeNormalizedSchemeValue(decoded, depth + 1, options);
  }

  if (type === 'base64') {
    const decoded = options.base64Decode(trimmed);
    return decoded !== trimmed && shouldExposeNormalizedSchemeValue(decoded, depth + 1, options);
  }

  return true;
};

export const isActionableSchemeUrlWithOptions = (
  value: string,
  options: SchemeExposureOptions,
  depth = 0
): boolean => {
  if (depth > ACTIONABLE_URL_MAX_DEPTH) return false;

  const trimmed = normalizeJsonUrlEscapes(value.trim());
  if (!options.isUrl(trimmed)) return false;

  try {
    const url = createUrl(trimmed);
    if (!isHttpSchemeProtocol(url.protocol)) return true;

    return hasActionableHttpUrlParams(url, depth + 1, createNestedCommandExposureOptions(options));
  } catch {
    return false;
  }
};

export const shouldExposeSchemeValueWithOptions = (
  value: string,
  options: SchemeExposureOptions
): boolean => (
  typeof value === 'string' &&
  value.length > 0 &&
  shouldExposeNormalizedSchemeValue(value, 0, options)
);
