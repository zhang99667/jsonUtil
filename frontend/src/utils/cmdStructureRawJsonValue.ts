import type { JsonValue } from '../types';
import { safeDecodeURIComponent } from './cmdStructureRawSourceGuards';

interface JsonObject {
  [key: string]: JsonValue;
}

const parseJsonCandidate = (candidate: string): JsonValue | undefined => {
  try {
    return JSON.parse(candidate) as JsonValue;
  } catch {
    return undefined;
  }
};

const looksLikeJsonText = (value: string): boolean => /^[{["]/.test(value);

export const toCmdStructureJsonValue = (value: unknown): JsonValue => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  if (value === null) return null;

  if (Array.isArray(value)) return value.map(toCmdStructureJsonValue);

  if (Boolean(value) && typeof value === 'object') {
    const result: JsonObject = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      result[key] = toCmdStructureJsonValue(item);
    });
    return result;
  }

  return String(value);
};

export const tryParseRawCmdJsonString = (value: string): JsonValue | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (looksLikeJsonText(trimmed)) {
    const parsed = parseJsonCandidate(trimmed);
    if (parsed !== undefined) return parsed;
  }

  const decoded = safeDecodeURIComponent(trimmed);
  const decodedTrimmed = decoded.trim();
  return decoded !== trimmed && looksLikeJsonText(decodedTrimmed)
    ? parseJsonCandidate(decodedTrimmed)
    : undefined;
};
