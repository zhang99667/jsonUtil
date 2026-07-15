import type { JsonValue } from '../types';
import { normalizeRawSourceString } from './cmdStructureRawSource';
import { isJsonObject } from './jsonValueGuards';

const getStructuredSourceValue = (value: JsonValue): string | undefined => (
  isJsonObject(value) && typeof value.source === 'string'
    ? normalizeRawSourceString(value.source)
    : undefined
);

export const isStructuredSourceEquivalent = (actual: JsonValue, expected: JsonValue): boolean => {
  if (typeof actual === 'string') {
    return getStructuredSourceValue(expected) === normalizeRawSourceString(actual);
  }

  if (typeof expected === 'string') {
    return getStructuredSourceValue(actual) === normalizeRawSourceString(expected);
  }

  return false;
};
