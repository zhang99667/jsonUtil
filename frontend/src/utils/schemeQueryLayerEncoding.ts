import {
  formatSchemeLogFieldSeparator,
  wrapSchemeLogFieldValue,
} from './schemeLogFields';
import { getSingleRawUrlParam } from './schemeRawParams';
import { encodeUrlLayerContent } from './schemeUrlLayerEncoding';
import {
  buildQueryStringFromObject,
  isPlainObject,
  stringifyParamValue,
} from './schemeStructuredQuery';
import type {
  SchemeLayerEncodingOptions,
  SchemeLayerEncoder,
} from './schemeLayerEncoding';

export type PrefixedQueryLookup = (source: string) => { prefix: string; queryString: string } | null;

const encodeSingleRawUrlParamContent = (
  editedParams: Record<string, unknown>,
  originalQueryString: string,
  options: SchemeLayerEncodingOptions
): string | null => {
  const singleRawUrlParam = getSingleRawUrlParam(originalQueryString, options.createRawParamOptions());
  if (!singleRawUrlParam) return null;

  const keys = Object.keys(editedParams);
  if (keys.length !== 1 || !Object.prototype.hasOwnProperty.call(editedParams, singleRawUrlParam.key)) {
    return null;
  }

  const editedUrlParams = editedParams[singleRawUrlParam.key];
  if (!isPlainObject(editedUrlParams)) return null;

  const rebuiltUrl = encodeUrlLayerContent(JSON.stringify(editedUrlParams), singleRawUrlParam.value, options);
  return `${singleRawUrlParam.rawKey}=${rebuiltUrl}`;
};

const encodeSingleLogFieldParamContent = (
  editedParams: Record<string, unknown>,
  originalQueryString: string,
  getPrefixedQueryString: PrefixedQueryLookup,
  options: SchemeLayerEncodingOptions,
  encodeWithLayers: SchemeLayerEncoder
): string | null => {
  const logFieldParam = options.parseLogFieldParamString(originalQueryString);
  if (!logFieldParam) return null;

  const keys = Object.keys(editedParams);
  if (keys.length !== 1 || !Object.prototype.hasOwnProperty.call(editedParams, logFieldParam.key)) {
    return null;
  }

  const editedValue = editedParams[logFieldParam.key];
  const editedContent = isPlainObject(editedValue) || Array.isArray(editedValue)
    ? JSON.stringify(editedValue)
    : stringifyParamValue(editedValue);
  const encodedValue = encodeWithLayers(
    editedContent,
    options.decodeLayersForValue(logFieldParam.value),
    getPrefixedQueryString,
    options
  );

  const suffix = logFieldParam.trailingComma ? ',' : '';
  return `${logFieldParam.prefix || ''}${logFieldParam.rawKey}${formatSchemeLogFieldSeparator(logFieldParam.delimiter)}${wrapSchemeLogFieldValue(encodedValue, logFieldParam.quote)}${suffix}`;
};

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
