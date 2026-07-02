import {
  formatSchemeLogFieldSeparator,
  wrapSchemeLogFieldValue,
} from './schemeLogFields';
import { getSingleRawUrlParam } from './schemeRawParams';
import { encodeUrlLayerContent } from './schemeUrlLayerEncoding';
import {
  isPlainObject,
  stringifyParamValue,
} from './schemeStructuredQuery';
import type {
  SchemeLayerEncodingOptions,
  SchemeLayerEncoder,
} from './schemeLayerEncoding';

type PrefixedQueryLookup = (source: string) => { prefix: string; queryString: string } | null;

export const encodeSingleRawUrlParamContent = (
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

export const encodeSingleLogFieldParamContent = (
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
