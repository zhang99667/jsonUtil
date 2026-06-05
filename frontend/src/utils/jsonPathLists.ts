import { parseJsonWithFallback } from './storage';

export const JSONPATH_LIST_LIMIT = 10;
export const JSONPATH_HISTORY_STORAGE_KEY = 'jsonpath-query-history';
export const JSONPATH_FAVORITES_STORAGE_KEY = 'jsonpath-query-favorites';

export const normalizeJsonPathList = (
  items: unknown,
  limit: number = JSONPATH_LIST_LIMIT
): string[] => {
  if (!Array.isArray(items)) return [];

  const result: string[] = [];
  for (const item of items) {
    if (typeof item !== 'string') continue;

    const query = item.trim();
    if (!query || result.includes(query)) continue;

    result.push(query);
    if (result.length >= limit) break;
  }

  return result;
};

export const parseStoredJsonPathList = (stored: string | null): string[] => {
  return normalizeJsonPathList(parseJsonWithFallback<unknown>(stored, []));
};

export const addJsonPathListItem = (
  items: string[],
  query: string,
  limit: number = JSONPATH_LIST_LIMIT
): string[] => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return normalizeJsonPathList(items, limit);

  return [
    normalizedQuery,
    ...normalizeJsonPathList(items, limit).filter(item => item !== normalizedQuery),
  ].slice(0, limit);
};

export const removeJsonPathListItem = (items: string[], query: string): string[] => {
  return normalizeJsonPathList(items).filter(item => item !== query.trim());
};
