import {
  decodeNormalizedBase64,
  normalizeBase64Input,
} from './schemeBase64Codec';
import { normalizeBase64JsonFragment } from './schemeBase64JsonFragments';
import { appendPrefixedBase64Meta } from './schemeBase64SuffixMeta';
import type { SchemeBase64DecodeOptions } from './schemeBase64Types';

export const decodePrefixedBase64JsonFragment = (
  input: string,
  options: SchemeBase64DecodeOptions
): string | null => {
  const compact = input.trim().replace(/\s+/g, '');
  const firstPaddingIndex = compact.indexOf('=');
  const payloadEnd = firstPaddingIndex >= 0
    ? firstPaddingIndex + (compact[firstPaddingIndex + 1] === '=' ? 2 : 1)
    : compact.length;

  // 兼容真实广告 extraParam 中带内部头的 Base64 JSON 片段，保持解析保守，避免普通文本误判。
  for (let offset = 1; offset <= 12 && offset < payloadEnd; offset++) {
    const candidate = compact.slice(offset, payloadEnd);
    const normalized = normalizeBase64Input(candidate);
    if (!normalized) continue;

    const decoded = decodeNormalizedBase64(normalized);
    if (!decoded) continue;

    const jsonFragment = normalizeBase64JsonFragment(decoded, options);
    if (jsonFragment) {
      const prefix = compact.slice(0, offset);
      const suffix = compact.slice(payloadEnd);
      return appendPrefixedBase64Meta(jsonFragment, prefix, suffix, options);
    }
  }

  return null;
};
