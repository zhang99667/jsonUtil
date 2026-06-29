import {
  decodeNormalizedBase64,
  isReadableDecodedText,
  normalizeBase64Input,
} from './schemeBase64Codec';
import { decodePrefixedBase64JsonFragment } from './schemeBase64PrefixedJson';
import type {
  Base64DecodeResult,
  SchemeBase64DecodeOptions,
} from './schemeBase64Types';

export { base64Encode } from './schemeBase64Codec';
export { decodeJwt } from './schemeJwt';

export type {
  Base64DecodeResult,
  SchemeBase64DecodeOptions,
  SchemeBase64StructuredValue,
} from './schemeBase64Types';

export const decodeBase64WithMeta = (
  input: string,
  options: SchemeBase64DecodeOptions = {}
): Base64DecodeResult | null => {
  const normalized = normalizeBase64Input(input);
  if (normalized) {
    const decoded = decodeNormalizedBase64(normalized);
    if (decoded !== null) {
      return { decoded, reversible: true };
    }
  }

  const prefixedJson = decodePrefixedBase64JsonFragment(input, options);
  return prefixedJson ? { decoded: prefixedJson, reversible: false } : null;
};

export const base64Decode = (
  str: string,
  options: SchemeBase64DecodeOptions = {}
): string => (
  decodeBase64WithMeta(str, options)?.decoded ?? str
);

export const isBase64 = (
  str: string,
  options: SchemeBase64DecodeOptions = {}
): boolean => {
  const trimmed = str.trim();
  const decodedResult = decodeBase64WithMeta(trimmed, options);
  if (decodedResult && options.looksLikeStructuredPayload?.(decodedResult.decoded)) return true;

  // 排除 key=value 格式：Base64 的 = 只能作为末尾 padding。
  const equalSignIndex = trimmed.indexOf('=');
  if (equalSignIndex !== -1) {
    const afterEqual = trimmed.substring(equalSignIndex + 1);
    if (afterEqual.length > 0 && !/^=*$/.test(afterEqual)) {
      return false;
    }
  }

  if (!decodedResult || decodedResult.decoded === trimmed || decodedResult.decoded.length === 0) return false;
  if (options.looksLikeStructuredPayload?.(decodedResult.decoded)) return true;
  if (trimmed.length < 20) return false;

  return isReadableDecodedText(decodedResult.decoded);
};
