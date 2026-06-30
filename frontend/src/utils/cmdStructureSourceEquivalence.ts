import type { JsonValue } from '../types';
import { normalizeRawSourceString } from './cmdStructureRawSource';

interface JsonObject {
  [key: string]: JsonValue;
}

const isRecord = (value: JsonValue): value is JsonObject => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const getStructuredSourceValue = (value: JsonValue): string | undefined => (
  isRecord(value) && typeof value.source === 'string'
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
