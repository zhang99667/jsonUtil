import type {
  SchemeBase64DecodeOptions,
} from './schemeBase64Types';
import { parsePrefixedBase64Suffix } from './schemeBase64SuffixQuery';
import { parseJsonValue } from './jsonValueGuards';

export const appendPrefixedBase64Meta = (
  jsonFragment: string,
  prefix: string,
  suffix: string,
  options: SchemeBase64DecodeOptions
): string => {
  if (!suffix) return jsonFragment;

  try {
    const parsed = parseJsonValue(jsonFragment);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return jsonFragment;
    }

    const suffixMeta = parsePrefixedBase64Suffix(suffix, options);

    return JSON.stringify({
      ...parsed,
      _base64_prefix: prefix,
      _base64_suffix: suffix,
      ...(suffixMeta ? {
        _base64_suffix_decode_prefix: suffixMeta.prefix,
        _base64_suffix_decoded: suffixMeta.value,
      } : {}),
    });
  } catch {
    return jsonFragment;
  }
};
