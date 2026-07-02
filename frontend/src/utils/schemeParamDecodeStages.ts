import type { SchemeParamDecodeStage } from './schemeTypes';
import { createUrl } from './schemeUrlShapes';
import { createParamDecodeStage } from './schemeParamDecodeStageBuilder';
import {
  buildParamDecodeStagesFromPairs,
  DEFAULT_SCHEME_PARAM_STAGE_LIMIT,
  type SchemeParamDecodeStagePairsOptions,
} from './schemeParamDecodeStagePairs';

export { formatPlaceholderPathSegment } from './schemeParamDecodeStageBuilder';

export interface SchemeParamDecodeStagesOptions extends SchemeParamDecodeStagePairsOptions {
  getFragmentParamSource: (value: string) => string | null;
  getPrefixedQueryString: (value: string) => { queryString: string } | null;
  parseLogFieldParamString: (value: string) => { key: string; value: string } | null;
}

export const buildQueryStringParamDecodeStages = (
  queryString: string,
  maxDepth: number,
  options: SchemeParamDecodeStagesOptions
): SchemeParamDecodeStage[] => {
  const logFieldParam = options.parseLogFieldParamString(queryString);
  if (logFieldParam) {
    return [createParamDecodeStage(
      logFieldParam.key,
      logFieldParam.value,
      logFieldParam.value,
      'log-field',
      '$',
      maxDepth,
      options
    )];
  }

  const prefixedQueryString = options.getPrefixedQueryString(queryString);
  if (prefixedQueryString) {
    return buildParamDecodeStagesFromPairs(prefixedQueryString.queryString, 'prefixed-query', '$', maxDepth, options);
  }

  const fragmentParamSource = options.getFragmentParamSource(queryString);
  if (fragmentParamSource) {
    return buildParamDecodeStagesFromPairs(fragmentParamSource, 'fragment', '$', maxDepth, options);
  }

  return buildParamDecodeStagesFromPairs(queryString, 'query', '$', maxDepth, options);
};

export const buildUrlParamDecodeStages = (
  urlString: string,
  maxDepth: number,
  options: SchemeParamDecodeStagesOptions
): SchemeParamDecodeStage[] => {
  try {
    const url = createUrl(urlString);
    const stages: SchemeParamDecodeStage[] = [];
    const hasQueryParams = Boolean(url.search);
    const fragmentParamSource = options.getFragmentParamSource(url.hash);

    if (url.search) {
      stages.push(...buildParamDecodeStagesFromPairs(url.search, 'query', '$', maxDepth, options));
    }

    if (fragmentParamSource && stages.length < DEFAULT_SCHEME_PARAM_STAGE_LIMIT) {
      stages.push(...buildParamDecodeStagesFromPairs(
        fragmentParamSource,
        'hash',
        hasQueryParams ? '$._hash' : '$',
        maxDepth,
        options
      ).slice(0, DEFAULT_SCHEME_PARAM_STAGE_LIMIT - stages.length));
    }

    return stages;
  } catch {
    return [];
  }
};
