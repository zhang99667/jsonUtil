import {
  JSONPATH_FAVORITES_STORAGE_KEY,
  JSONPATH_HISTORY_STORAGE_KEY,
  normalizeJsonPathList,
  parseStoredJsonPathList,
} from './jsonPathLists';
import { safeGetStorageItem, safeRemoveStorageItem, safeSetStorageItem } from './storage';

export interface JsonPathSavedQueryLists {
  history: string[];
  favorites: string[];
}

export const normalizeJsonPathSavedQueryLists = (
  lists: Partial<Record<keyof JsonPathSavedQueryLists, unknown>> = {}
): JsonPathSavedQueryLists => ({
  history: normalizeJsonPathList(lists.history),
  favorites: normalizeJsonPathList(lists.favorites),
});

export const loadJsonPathSavedQueryLists = (
  storage?: Storage
): JsonPathSavedQueryLists => ({
  history: parseStoredJsonPathList(safeGetStorageItem(JSONPATH_HISTORY_STORAGE_KEY, storage)),
  favorites: parseStoredJsonPathList(safeGetStorageItem(JSONPATH_FAVORITES_STORAGE_KEY, storage)),
});

export const saveJsonPathHistory = (history: string[], storage?: Storage): boolean => (
  safeSetStorageItem(JSONPATH_HISTORY_STORAGE_KEY, JSON.stringify(history), storage)
);

export const saveJsonPathFavorites = (favorites: string[], storage?: Storage): boolean => (
  safeSetStorageItem(JSONPATH_FAVORITES_STORAGE_KEY, JSON.stringify(favorites), storage)
);

export const clearStoredJsonPathHistory = (storage?: Storage): boolean => (
  safeRemoveStorageItem(JSONPATH_HISTORY_STORAGE_KEY, storage)
);
