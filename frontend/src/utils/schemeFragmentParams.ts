import {
  QUERY_KEY_PATTERN,
  QUERY_PAIR_START_RE,
  normalizeQueryString,
} from './schemeQuerySyntax';

export interface FragmentParamSourceInfo {
  source: string;
  prefix: string;
}

export interface FragmentParamOptions {
  decodeUrl: (value: string) => string;
  isDecodableQueryString: (value: string) => boolean;
}

const getParamSourceInfoFromFragment = (fragment: string): FragmentParamSourceInfo | null => {
  const queryStart = fragment.startsWith('?') ? 0 : fragment.indexOf('?');
  if (queryStart >= 0) {
    const source = fragment.slice(queryStart + 1);
    const normalized = normalizeQueryString(source.replace(/^&/, ''));
    if (QUERY_PAIR_START_RE.test(normalized)) {
      return {
        source,
        prefix: fragment.slice(0, queryStart + 1),
      };
    }
  }

  const embeddedParamMatch = fragment.match(new RegExp(`[&](?=${QUERY_KEY_PATTERN}=)`));
  if (embeddedParamMatch?.index !== undefined) {
    const sourceStart = embeddedParamMatch.index + 1;
    const source = fragment.slice(sourceStart);
    if (QUERY_PAIR_START_RE.test(normalizeQueryString(source))) {
      return {
        source,
        prefix: fragment.slice(0, sourceStart),
      };
    }
  }

  if (QUERY_PAIR_START_RE.test(normalizeQueryString(fragment))) {
    return {
      source: fragment,
      prefix: '',
    };
  }

  return null;
};

export const getFragmentParamSourceInfo = (
  hash: string,
  decodeUrl: (value: string) => string
): FragmentParamSourceInfo | null => {
  const rawFragment = hash.replace(/^#/, '').trim();
  if (!rawFragment) return null;

  const rawInfo = getParamSourceInfoFromFragment(rawFragment);
  if (rawInfo) return rawInfo;

  const decodedFragment = decodeUrl(rawFragment);
  return decodedFragment !== rawFragment ? getParamSourceInfoFromFragment(decodedFragment) : null;
};

export const getFragmentParamSource = (
  hash: string,
  decodeUrl: (value: string) => string
): string | null => (
  getFragmentParamSourceInfo(hash, decodeUrl)?.source ?? null
);

export const isDecodableFragmentParamString = (
  source: string,
  options: FragmentParamOptions
): boolean => {
  const trimmed = source.trim();
  if (!trimmed.startsWith('#') && !trimmed.startsWith('/') && !trimmed.startsWith('?')) {
    return false;
  }

  const fragmentParamSource = getFragmentParamSource(trimmed, options.decodeUrl);
  return fragmentParamSource !== null && options.isDecodableQueryString(fragmentParamSource);
};
