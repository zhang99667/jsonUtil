import {
  RECENT_STRING_LIST_LIMIT,
  addRecentStringListItem,
  normalizeRecentStringList,
  parseStoredRecentStringList,
  removeRecentStringListItem,
} from './recentStringLists';

export const JSONPATH_LIST_LIMIT = RECENT_STRING_LIST_LIMIT;
export const JSONPATH_HISTORY_STORAGE_KEY = 'jsonpath-query-history';
export const JSONPATH_FAVORITES_STORAGE_KEY = 'jsonpath-query-favorites';

export const normalizeJsonPathList = (
  items: unknown,
  limit: number = JSONPATH_LIST_LIMIT
): string[] => normalizeRecentStringList(items, limit);

export const parseStoredJsonPathList = (stored: string | null): string[] => {
  return parseStoredRecentStringList(stored);
};

export const addJsonPathListItem = (
  items: string[],
  query: string,
  limit: number = JSONPATH_LIST_LIMIT
): string[] => addRecentStringListItem(items, query, limit);

export const removeJsonPathListItem = (items: string[], query: string): string[] => {
  return removeRecentStringListItem(items, query);
};
