import {
  buildQueryStringFromObject,
  isPlainObject,
} from './schemeStructuredQuery';
import {
  encodeSingleLogFieldParamContent,
  encodeSingleRawUrlParamContent,
} from './schemeQueryLayerSingleParamEncoding';
import type {
  SchemeLayerEncodingOptions,
  SchemeLayerEncoder,
} from './schemeLayerEncoding';

export type PrefixedQueryLookup = (source: string) => { prefix: string; queryString: string } | null;

const encodePrefixedQueryStringContent = (
  editedParams: Record<string, unknown>,
  originalQueryString: string,
  getPrefixedQueryString: PrefixedQueryLookup,
  options: SchemeLayerEncodingOptions
): string | null => {
  const prefixedQueryString = getPrefixedQueryString(originalQueryString);
  if (!prefixedQueryString) return null;

  const encodedQueryString = encodeSingleRawUrlParamContent(editedParams, prefixedQueryString.queryString, options) ||
    buildQueryStringFromObject(editedParams, prefixedQueryString.queryString);

  return `${prefixedQueryString.prefix}${encodedQueryString}`;
};

export const encodeQueryStringLayerContent = (
  content: string,
  originalQueryString: string,
  getPrefixedQueryString: PrefixedQueryLookup,
  options: SchemeLayerEncodingOptions,
  encodeWithLayers: SchemeLayerEncoder
): string | null => {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!isPlainObject(parsed)) return null;

    return encodeSingleLogFieldParamContent(parsed, originalQueryString, getPrefixedQueryString, options, encodeWithLayers) ||
      encodeSingleRawUrlParamContent(parsed, originalQueryString, options) ||
      encodePrefixedQueryStringContent(parsed, originalQueryString, getPrefixedQueryString, options) ||
      buildQueryStringFromObject(parsed, originalQueryString);
  } catch {
    return null;
  }
};
