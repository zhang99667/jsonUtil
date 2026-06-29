import type { SchemeStructuredDecodeState } from './schemeStructuredDecodeTypes';

export const DEFAULT_SCHEME_JSON_STRING_DECODE_LIMIT = 256_000;
export const DEFAULT_SCHEME_JSON_TOTAL_STRING_DECODE_LIMIT = 1_500_000;

export const createSchemeStructuredDecodeState = (): SchemeStructuredDecodeState => ({
  maxStringDecodeLength: DEFAULT_SCHEME_JSON_STRING_DECODE_LIMIT,
  maxTotalStringDecodeLength: DEFAULT_SCHEME_JSON_TOTAL_STRING_DECODE_LIMIT,
  totalStringDecodeLength: 0,
  decodedStringCount: 0,
  skippedStringCount: 0,
  skippedPaths: [],
});
