import {
  addRecentStringListItem,
  normalizeRecentStringList,
  parseStoredRecentStringList,
  removeRecentStringListItem,
} from './recentStringLists';

export const JSON_TREE_SEARCH_HISTORY_STORAGE_KEY = 'json-tree-search-history';

export const normalizeJsonTreeSearchHistory = (
  items: unknown,
  limit?: number
): string[] => normalizeRecentStringList(items, limit);

export const parseStoredJsonTreeSearchHistory = (
  stored: string | null
): string[] => parseStoredRecentStringList(stored);

export const addJsonTreeSearchHistoryItem = (
  items: string[],
  query: string
): string[] => addRecentStringListItem(items, query);

export const removeJsonTreeSearchHistoryItem = (
  items: string[],
  query: string
): string[] => removeRecentStringListItem(items, query);
