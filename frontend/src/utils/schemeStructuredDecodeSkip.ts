import type { SchemeStructuredDecodeState } from './schemeStructuredDecodeTypes';

const DEFAULT_SCHEME_JSON_SKIPPED_PATH_LIMIT = 8;

export const exceedsSchemeStructuredDecodeBudget = (
  value: string,
  state: SchemeStructuredDecodeState
): boolean => (
  value.length > state.maxStringDecodeLength ||
  state.totalStringDecodeLength + value.length > state.maxTotalStringDecodeLength
);

export const recordSchemeStructuredDecodeSkip = (
  path: string,
  state: SchemeStructuredDecodeState
): void => {
  state.skippedStringCount += 1;
  if (state.skippedPaths.length < DEFAULT_SCHEME_JSON_SKIPPED_PATH_LIMIT) {
    state.skippedPaths.push(path);
  }
};
