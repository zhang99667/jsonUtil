import { tryParseJson } from './schemeJsonPayloads';
import {
  shouldSkipSchemeStructuredStringDecode,
  type SchemeStructuredDecodeState,
} from './schemeStructuredDecodeGuards';
import type { SchemeDecodeResult, SchemeType, StructuredValue } from './schemeTypes';
import { isSchemeDisplayProjectionHeader, type SchemeDecodeDisplayContext } from './schemeDisplayProjection';
import { createSchemeNestedQueryDecoder, type SchemeNestedQueryDecodingOptions } from './schemeNestedQueryDecoding';
import { transformSchemeStructuredValue } from './schemeStructuredValueTraversal';

export interface SchemeNestedDecodingOptions
  extends Omit<SchemeNestedQueryDecodingOptions, 'decodeNestedParamValue'> {
  base64Decode: (value: string) => string;
  decodeScheme: (
    value: string,
    maxDepth: number,
    context?: SchemeDecodeDisplayContext,
  ) => SchemeDecodeResult;
  detectSchemeType: (value: string) => SchemeType;
  looksLikeStructuredPayload: (value: string) => boolean;
  tryParseJsonStringPayload: (value: string) => string | null;
}

export const createSchemeNestedDecoder = (
  options: SchemeNestedDecodingOptions,
) => {
  const queryDecoder = createSchemeNestedQueryDecoder({
    ...options,
    decodeNestedParamValue: (value, maxDepth, context) => (
      decodeNestedParamValue(value, maxDepth, context)
    ),
  });

  const decodeStructuredValue = (
    value: StructuredValue,
    maxDepth: number,
    state?: SchemeStructuredDecodeState,
    path = '$',
    context?: SchemeDecodeDisplayContext,
  ): StructuredValue => {
    if (maxDepth <= 0) return value;
    return transformSchemeStructuredValue(value, path, {
      transformString: (item, itemPath) => {
        if (options.detectSchemeType(item) === 'plain') return item;
        if (shouldSkipSchemeStructuredStringDecode(item, itemPath, state)) return item;
        return decodeNestedParamValue(item, maxDepth - 1, context);
      },
      shouldPreserveProperty: (key, item) => (
        isSchemeDisplayProjectionHeader(context, key, item)
      ),
    });
  };

  const decodeBase64StructuredParam = (
    value: string,
    maxDepth: number,
    context?: SchemeDecodeDisplayContext,
  ): StructuredValue | null => {
    const decoded = options.base64Decode(value);
    if (decoded === value || !options.looksLikeStructuredPayload(decoded)) return null;

    return decodeNestedParamValue(decoded, maxDepth, context);
  };

  function decodeNestedParamValue(
    value: string,
    maxDepth: number,
    context?: SchemeDecodeDisplayContext,
  ): StructuredValue {
    if (maxDepth <= 0) return value;

    const jsonValue = tryParseJson(value);
    if (jsonValue !== null) {
      return decodeStructuredValue(jsonValue, maxDepth - 1, undefined, '$', context);
    }

    const jsonStringPayload = options.tryParseJsonStringPayload(value);
    if (jsonStringPayload !== null) {
      return decodeNestedParamValue(jsonStringPayload, maxDepth, context);
    }

    const fragmentValue = queryDecoder.parseFragmentValueDeep(
      value,
      maxDepth - 1,
      context,
    );
    if (fragmentValue !== null) return fragmentValue;

    const base64Value = decodeBase64StructuredParam(value, maxDepth - 1, context);
    if (base64Value !== null) return base64Value;

    const nested = options.decodeScheme(value, maxDepth, context);
    if (nested.isJson) {
      const parsed = tryParseJson(nested.decoded);
      return parsed === null
        ? nested.decoded
        : decodeStructuredValue(parsed, maxDepth - 1, undefined, '$', context);
    }

    return nested.layers.length > 0 ? nested.decoded : value;
  }

  return {
    decodeNestedParamValue,
    decodeStructuredValue,
    parseQueryStringDeep: queryDecoder.parseQueryStringDeep,
    parseUrlParamsDeep: queryDecoder.parseUrlParamsDeep,
  };
};
