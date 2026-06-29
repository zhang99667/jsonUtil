import { isKnownDecodableParamName } from './structuredParamNames';
import {
  QUERY_PAIR_START_RE,
  normalizeQueryString,
  splitQueryPairs,
  stripQueryPrefix,
} from './schemeQuerySyntax';
import {
  isStructuredActionableParamValue,
  type SchemeStructuredActionableParamValueOptions,
} from './schemeStructuredActionableParamValue';

export interface SchemeNestedCommandExposureOptions extends SchemeStructuredActionableParamValueOptions {
  decodeQueryKey: (value: string) => string;
  decodeQueryValue: (value: string) => string;
  getFragmentParamSource: (hash: string) => string | null;
}

export { isStructuredActionableParamValue };

export const hasActionableUrlParamSource = (
  paramSource: string,
  depth: number,
  options: SchemeNestedCommandExposureOptions
): boolean => {
  const source = normalizeQueryString(stripQueryPrefix(paramSource));
  if (!source || !QUERY_PAIR_START_RE.test(source)) return false;

  return splitQueryPairs(source).some(pair => {
    const equalIndex = pair.indexOf('=');
    if (equalIndex <= 0) return false;

    const key = options.decodeQueryKey(pair.slice(0, equalIndex));
    if (!key || !isKnownDecodableParamName(key)) return false;

    const value = options.decodeQueryValue(pair.slice(equalIndex + 1));
    return isStructuredActionableParamValue(value, depth + 1, options);
  });
};

export const hasActionableHttpUrlParams = (
  url: URL,
  depth: number,
  options: SchemeNestedCommandExposureOptions
): boolean => {
  if (url.search && hasActionableUrlParamSource(url.search, depth + 1, options)) {
    return true;
  }

  const hashParamSource = url.hash ? options.getFragmentParamSource(url.hash) : null;
  return Boolean(hashParamSource && hasActionableUrlParamSource(hashParamSource, depth + 1, options));
};
