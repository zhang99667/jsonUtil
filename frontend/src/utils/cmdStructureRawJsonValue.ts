import type { JsonValue } from '../types';
export { toCmdStructureJsonValue } from './cmdStructureRawJsonValueCoercion';
import { safeDecodeURIComponent } from './cmdStructureRawSourceGuards';
import { parseJsonWithFallback } from './storage';

const looksLikeJsonText = (value: string): boolean => /^[{["]/.test(value);

export const tryParseRawCmdJsonString = (value: string): JsonValue | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (looksLikeJsonText(trimmed)) {
    const parsed = parseJsonWithFallback<JsonValue | undefined>(trimmed, undefined);
    if (parsed !== undefined) return parsed;
  }

  const decoded = safeDecodeURIComponent(trimmed);
  const decodedTrimmed = decoded.trim();
  return decoded !== trimmed && looksLikeJsonText(decodedTrimmed)
    ? parseJsonWithFallback<JsonValue | undefined>(decodedTrimmed, undefined)
    : undefined;
};
