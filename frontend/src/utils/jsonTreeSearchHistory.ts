export const JSON_TREE_SEARCH_HISTORY_STORAGE_KEY = 'json-tree-search-history';

export {
  addRecentStringListItem as addJsonTreeSearchHistoryItem,
  normalizeRecentStringList as normalizeJsonTreeSearchHistory,
  parseStoredRecentStringList as parseStoredJsonTreeSearchHistory,
  removeRecentStringListItem as removeJsonTreeSearchHistoryItem,
} from './recentStringLists';
