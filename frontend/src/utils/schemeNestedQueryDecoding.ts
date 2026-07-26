import {
  createSchemeUrlContext,
  type SchemeUrlContext,
} from './schemeUrlShapes';
import {
  iterateDecodedQueryPairs,
  QUERY_PAIR_START_RE,
  normalizeQueryString,
  stripQueryPrefix,
} from './schemeQuerySyntax';
import {
  assignQueryParam,
  type StructuredQueryParamContainer,
} from './schemeStructuredQuery';
import type { SchemeLogFieldParam } from './schemeLogFields';
import {
  getSingleRawStructuredParam,
  getSingleRawUrlParam,
  type SchemeRawParamOptions,
} from './schemeRawParams';
import type { StructuredValue } from './schemeTypes';
import type { SchemeDecodeDisplayContext } from './schemeDisplayProjection';

type PrefixedQueryString = {
  queryString: string;
};

export interface SchemeNestedQueryDecodingOptions {
  createRawParamOptions: () => SchemeRawParamOptions;
  decodeNestedParamValue: (
    value: string,
    maxDepth: number,
    context?: SchemeDecodeDisplayContext,
  ) => StructuredValue;
  decodeQueryComponent: (value: string) => string;
  decodeQueryValueComponent: (value: string) => string;
  getFragmentParamSource: (value: string) => string | null;
  getPrefixedQueryString: (value: string) => PrefixedQueryString | null;
  isDecodableQueryString: (value: string) => boolean;
  parseLogFieldParamString: (value: string) => SchemeLogFieldParam | null;
}

export const createSchemeNestedQueryDecoder = (
  options: SchemeNestedQueryDecodingOptions,
) => {
  const parseQueryPairsDeep = (
    queryString: string,
    maxDepth: number,
    context?: SchemeDecodeDisplayContext,
  ): StructuredValue => {
    const singleRawStructuredParam = getSingleRawStructuredParam(
      queryString,
      options.createRawParamOptions(),
    );
    if (singleRawStructuredParam) {
      return {
        [singleRawStructuredParam.key]: options.decodeNestedParamValue(
          singleRawStructuredParam.value,
          maxDepth - 1,
          context,
        ),
      };
    }

    const singleRawUrlParam = getSingleRawUrlParam(
      queryString,
      options.createRawParamOptions(),
    );
    if (singleRawUrlParam) {
      return {
        [singleRawUrlParam.key]: options.decodeNestedParamValue(
          singleRawUrlParam.value,
          maxDepth - 1,
          context,
        ),
      };
    }

    const result: StructuredQueryParamContainer = {};
    for (const { key, value } of iterateDecodedQueryPairs(
      queryString,
      options.decodeQueryComponent,
      options.decodeQueryValueComponent,
    )) {
      assignQueryParam(
        result,
        key,
        options.decodeNestedParamValue(value, maxDepth - 1, context),
      );
    }
    return result as StructuredValue;
  };

  const parseUrlQueryStringDeep = (
    queryString: string,
    maxDepth: number,
    context?: SchemeDecodeDisplayContext,
  ): StructuredValue | null => {
    const source = normalizeQueryString(stripQueryPrefix(queryString));
    if (!source || !QUERY_PAIR_START_RE.test(source)) return null;

    return parseQueryPairsDeep(source, maxDepth, context);
  };

  const parseQueryStringDeep = (
    queryString: string,
    maxDepth: number,
    context?: SchemeDecodeDisplayContext,
  ): StructuredValue | null => {
    const logFieldParam = options.parseLogFieldParamString(queryString);
    if (logFieldParam) {
      return {
        [logFieldParam.key]: options.decodeNestedParamValue(
          logFieldParam.value,
          maxDepth - 1,
          context,
        ),
      };
    }

    const source = normalizeQueryString(stripQueryPrefix(queryString));
    if (source && options.isDecodableQueryString(source)) {
      return parseQueryPairsDeep(source, maxDepth, context);
    }

    const prefixedQueryString = options.getPrefixedQueryString(queryString);
    if (prefixedQueryString) {
      return parseQueryPairsDeep(prefixedQueryString.queryString, maxDepth, context);
    }

    const fragmentParamSource = options.getFragmentParamSource(queryString);
    if (!fragmentParamSource || !options.isDecodableQueryString(fragmentParamSource)) {
      return null;
    }

    return parseQueryPairsDeep(fragmentParamSource, maxDepth, context);
  };

  const parseFragmentValueDeep = (
    value: string,
    maxDepth: number,
    context?: SchemeDecodeDisplayContext,
  ): StructuredValue | null => {
    const trimmed = value.trim();
    if (!trimmed.startsWith('#') && !trimmed.startsWith('/') && !trimmed.startsWith('?')) {
      return null;
    }

    const fragmentParamSource = options.getFragmentParamSource(trimmed);
    return fragmentParamSource
      ? parseUrlQueryStringDeep(fragmentParamSource, maxDepth, context)
      : null;
  };

  const mergeUrlDecodedParams = (
    queryParams: StructuredValue | null,
    hashParams: StructuredValue | null,
  ): StructuredValue | null => {
    if (queryParams && hashParams && !Array.isArray(queryParams) && typeof queryParams === 'object') {
      return {
        ...queryParams,
        _hash: hashParams,
      } as StructuredValue;
    }

    return queryParams || hashParams;
  };

  const parseUrlParamsDeep = (
    source: string | SchemeUrlContext,
    maxDepth: number,
    context?: SchemeDecodeDisplayContext,
  ): StructuredValue | null => {
    try {
      const url = typeof source === 'string'
        ? createSchemeUrlContext(source).url
        : source.url;
      const queryParams = url.search
        ? parseUrlQueryStringDeep(url.search, maxDepth, context)
        : null;
      const fragmentParamSource = options.getFragmentParamSource(url.hash);
      const hashParams = fragmentParamSource
        ? parseUrlQueryStringDeep(fragmentParamSource, maxDepth, context)
        : null;

      return mergeUrlDecodedParams(queryParams, hashParams);
    } catch {
      return null;
    }
  };

  return {
    parseFragmentValueDeep,
    parseQueryStringDeep,
    parseUrlParamsDeep,
  };
};
