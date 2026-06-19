import { parseJsonWithFallback } from './storage';

export const RECENT_STRING_LIST_LIMIT = 10;

export const normalizeRecentStringList = (
  items: unknown,
  limit: number = RECENT_STRING_LIST_LIMIT
): string[] => {
  if (!Array.isArray(items)) return [];

  const result: string[] = [];
  for (const item of items) {
    if (typeof item !== 'string') continue;

    const value = item.trim();
    if (!value || result.includes(value)) continue;

    result.push(value);
    if (result.length >= limit) break;
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
  const normalizedValue = value.trim();
  if (!normalizedValue) return normalizeRecentStringList(items, limit);

  return [
    normalizedValue,
    ...normalizeRecentStringList(items, limit).filter(item => item !== normalizedValue),
  ].slice(0, limit);
};

export const removeRecentStringListItem = (items: string[], value: string): string[] => {
  return normalizeRecentStringList(items).filter(item => item !== value.trim());
};
