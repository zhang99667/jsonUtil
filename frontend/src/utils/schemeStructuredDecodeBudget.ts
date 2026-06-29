import type { SchemeStructuredDecodeState } from './schemeStructuredDecodeTypes';
import {
  exceedsSchemeStructuredDecodeBudget,
  recordSchemeStructuredDecodeSkip,
} from './schemeStructuredDecodeSkip';

export const shouldSkipSchemeStructuredStringDecode = (
  value: string,
  path: string,
  state?: SchemeStructuredDecodeState
): boolean => {
  if (!state) return false;

  if (exceedsSchemeStructuredDecodeBudget(value, state)) {
    recordSchemeStructuredDecodeSkip(path, state);
    return true;
  }

  state.totalStringDecodeLength += value.length;
  state.decodedStringCount += 1;
  return false;
};
