import {
  decodeNormalizedBase64,
  decodeNormalizedBase64ReadablePrefix,
  isReadableDecodedText,
  normalizeBase64Input,
} from './schemeBase64Codec';
import type {
  SchemeBase64DecodeOptions,
  SchemeBase64StructuredValue,
} from './schemeBase64Types';

export interface PrefixedBase64SuffixDecode {
  prefix: string;
  value: SchemeBase64StructuredValue;
}

const trimDecodedSuffixQueryPayload = (decoded: string): string => {
  const trimmed = decoded.trim();
  if (!/^[?&]?[A-Za-z_$][\w$.[\]-]*=/.test(trimmed)) return decoded;

  // 真实 extraParam 后缀可能在 query 前缀后继续拼接 JSON 残片，直接按 & 拆会污染最后一个参数。
  const jsonFragmentIndex = trimmed.search(/","[A-Za-z_$][\w$]*":/);
  return jsonFragmentIndex > 0 ? trimmed.slice(0, jsonFragmentIndex) : decoded;
};

export const parsePrefixedBase64Suffix = (
  suffix: string,
  options: SchemeBase64DecodeOptions
): PrefixedBase64SuffixDecode | null => {
  const { decodeNestedParamValue, looksLikeStructuredPayload } = options;
  if (!decodeNestedParamValue || !looksLikeStructuredPayload) return null;

  const compact = suffix.trim().replace(/\s+/g, '');
  if (!compact) return null;

  // 真实 extraParam 后缀常带少量内部头字符，跳过后可解出 query-string。
  for (let offset = 0; offset <= 12 && offset < compact.length; offset++) {
    const candidate = compact.slice(offset);
    const normalized = normalizeBase64Input(candidate);
    if (!normalized) continue;

    const strictDecoded = decodeNormalizedBase64(normalized);
    const decoded = strictDecoded && isReadableDecodedText(strictDecoded)
      ? strictDecoded
      : decodeNormalizedBase64ReadablePrefix(normalized);
    if (!decoded || !looksLikeStructuredPayload(decoded)) continue;

    const parsed = decodeNestedParamValue(trimDecodedSuffixQueryPayload(decoded));
    if (parsed && typeof parsed === 'object') {
      return {
        prefix: compact.slice(0, offset),
        value: parsed,
      };
    }
  }

  return null;
};
