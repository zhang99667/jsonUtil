import {
  getParamSourceInfoFromFragment,
  type FragmentParamSourceInfo,
} from './schemeFragmentParamSourceInfo';

export type { FragmentParamSourceInfo } from './schemeFragmentParamSourceInfo';

export interface FragmentParamOptions {
  decodeUrl: (value: string) => string;
  isDecodableQueryString: (value: string) => boolean;
}

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
