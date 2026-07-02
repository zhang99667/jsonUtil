import {
  QUERY_KEY_PATTERN,
  QUERY_PAIR_START_RE,
  normalizeQueryString,
} from './schemeQuerySyntax';

export interface FragmentParamSourceInfo {
  source: string;
  prefix: string;
}

const buildFragmentParamSourceInfo = (
  fragment: string,
  sourceStart: number,
  prefixEnd: number,
  shouldStripLeadingAmpersand = false
): FragmentParamSourceInfo | null => {
  const source = fragment.slice(sourceStart);
  const normalizedSource = shouldStripLeadingAmpersand
    ? source.replace(/^&/, '')
    : source;

  if (!QUERY_PAIR_START_RE.test(normalizeQueryString(normalizedSource))) return null;

  return {
    source,
    prefix: fragment.slice(0, prefixEnd),
  };
};

const getQuestionParamSourceInfo = (fragment: string): FragmentParamSourceInfo | null => {
  const queryStart = fragment.startsWith('?') ? 0 : fragment.indexOf('?');
  return queryStart >= 0
    ? buildFragmentParamSourceInfo(fragment, queryStart + 1, queryStart + 1, true)
    : null;
};

const getEmbeddedParamSourceInfo = (fragment: string): FragmentParamSourceInfo | null => {
  const embeddedParamMatch = fragment.match(new RegExp(`[&](?=${QUERY_KEY_PATTERN}=)`));
  if (embeddedParamMatch?.index === undefined) return null;

  const sourceStart = embeddedParamMatch.index + 1;
  return buildFragmentParamSourceInfo(fragment, sourceStart, sourceStart);
};

const getBareParamSourceInfo = (fragment: string): FragmentParamSourceInfo | null => (
  buildFragmentParamSourceInfo(fragment, 0, 0)
);

export const getParamSourceInfoFromFragment = (
  fragment: string
): FragmentParamSourceInfo | null => (
  getQuestionParamSourceInfo(fragment) ??
  getEmbeddedParamSourceInfo(fragment) ??
  getBareParamSourceInfo(fragment)
);
