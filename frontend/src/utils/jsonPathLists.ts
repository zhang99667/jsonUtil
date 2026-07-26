import { RECENT_STRING_LIST_LIMIT } from './recentStringLists';

export const JSONPATH_LIST_LIMIT = RECENT_STRING_LIST_LIMIT;
export const JSONPATH_HISTORY_STORAGE_KEY = 'jsonpath-query-history';
export const JSONPATH_FAVORITES_STORAGE_KEY = 'jsonpath-query-favorites';

export {
  addRecentStringListItem as addJsonPathListItem,
  normalizeRecentStringList as normalizeJsonPathList,
  parseStoredRecentStringList as parseStoredJsonPathList,
  removeRecentStringListItem as removeJsonPathListItem,
} from './recentStringLists';
