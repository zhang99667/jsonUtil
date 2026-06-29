import type { SchemeParamDecodeStage } from './schemeUtils';
import { normalizeQueryString, splitQueryPairs, stripQueryPrefix } from './schemeQuerySyntax';
import { createUrl } from './schemeUrlShapes';
import {
  createParamDecodeStage,
  type SchemeParamDecodeStageBuilderOptions,
} from './schemeParamDecodeStageBuilder';

const DEFAULT_SCHEME_PARAM_STAGE_LIMIT = 24;

interface SchemeParamDecodeStagesOptions extends SchemeParamDecodeStageBuilderOptions {
  decodeKey: (value: string) => string;
  decodeValue: (value: string) => string;
  getFragmentParamSource: (value: string) => string | null;
  getPrefixedQueryString: (value: string) => { queryString: string } | null;
  parseLogFieldParamString: (value: string) => { key: string; value: string } | null;
}

export { formatPlaceholderPathSegment } from './schemeParamDecodeStageBuilder';

const buildParamDecodeStagesFromPairs = (
  queryString: string,
  source: SchemeParamDecodeStage['source'],
  pathPrefix: string,
  maxDepth: number,
  options: SchemeParamDecodeStagesOptions
): SchemeParamDecodeStage[] => {
  const stages: SchemeParamDecodeStage[] = [];
  const normalized = normalizeQueryString(stripQueryPrefix(queryString));

  for (const pair of splitQueryPairs(normalized)) {
    if (stages.length >= DEFAULT_SCHEME_PARAM_STAGE_LIMIT) break;

    const equalIndex = pair.indexOf('=');
    if (equalIndex <= 0) continue;

    const key = options.decodeKey(pair.slice(0, equalIndex));
    if (!key) continue;

    const rawValue = pair.slice(equalIndex + 1);
    stages.push(createParamDecodeStage(
      key,
      rawValue,
      options.decodeValue(rawValue),
      source,
      pathPrefix,
      maxDepth,
      options
    ));
  }

  return stages;
};

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
