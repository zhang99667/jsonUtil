import { parseJsonWithFallback } from './storage';

export const RECENT_STRING_LIST_LIMIT = 10;

const normalizeRecentStringListLimit = (limit: number): number => (
  Number.isFinite(limit) ? Math.max(0, Math.trunc(limit)) : 0
);

export const normalizeRecentStringList = (
  items: unknown,
  limit: number = RECENT_STRING_LIST_LIMIT
): string[] => {
  const normalizedLimit = normalizeRecentStringListLimit(limit);
  if (!Array.isArray(items) || normalizedLimit === 0) return [];

  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (typeof item !== 'string') continue;

    const value = item.trim();
    if (!value || seen.has(value)) continue;

    seen.add(value);
    result.push(value);
    if (result.length >= normalizedLimit) break;
  }

  return result;
};

export const parseStoredRecentStringList = (stored: string | null): string[] => {
  return normalizeRecentStringList(parseJsonWithFallback<unknown>(stored, []));
};

export const addRecentStringListItem = (
  items: string[],
  value: string,
  limit: number = RECENT_STRING_LIST_LIMIT
): string[] => {
  const normalizedItems = normalizeRecentStringList(items, limit);
  return normalizeRecentStringList([value, ...normalizedItems], limit);
};

export const removeRecentStringListItem = (items: string[], value: string): string[] => {
  return normalizeRecentStringList(items).filter(item => item !== value.trim());
};
