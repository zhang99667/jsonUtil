import type { JsonValue } from '../types';
export { toCmdStructureJsonValue } from './cmdStructureRawJsonValueCoercion';
import { safeDecodeURIComponent } from './cmdStructureRawSourceGuards';

const parseJsonCandidate = (candidate: string): JsonValue | undefined => {
  try {
    return JSON.parse(candidate) as JsonValue;
  } catch {
    return undefined;
  }
};

const looksLikeJsonText = (value: string): boolean => /^[{["]/.test(value);

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
