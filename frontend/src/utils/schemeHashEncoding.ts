import { getFragmentParamSourceInfo } from './schemeFragmentParams';
import {
  normalizeQueryString,
  QUERY_PAIR_START_RE,
} from './schemeQuerySyntax';

export const replaceHashParams = (hash: string, queryString: string): string => {
  const fragment = hash.replace(/^#/, '');
  if (QUERY_PAIR_START_RE.test(normalizeQueryString(fragment))) {
    return queryString;
  }

  const paramSourceInfo = getFragmentParamSourceInfo(fragment.trim(), value => value);
  if (paramSourceInfo) {
    return queryString ? `${paramSourceInfo.prefix}${queryString}` : paramSourceInfo.prefix.replace(/[?&]$/, '');
  }

  if (!fragment) {
    return queryString ? `?${queryString}` : '';
  }

  if (fragment.startsWith('?')) {
    return queryString ? `?${queryString}` : '';
  }

  const queryStart = fragment.indexOf('?');
  if (queryStart >= 0) {
    return queryString ? `${fragment.slice(0, queryStart + 1)}${queryString}` : fragment.slice(0, queryStart);
  }

  return queryString ? `${fragment}?${queryString}` : fragment;
};
