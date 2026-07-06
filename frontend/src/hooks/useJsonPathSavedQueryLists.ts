import { useCallback, useEffect, useState } from 'react';
import { APP_BACKUP_IMPORTED_EVENT } from '../utils/appBackup';
import {
  addJsonPathListItem,
  JSONPATH_FAVORITES_STORAGE_KEY,
  JSONPATH_HISTORY_STORAGE_KEY,
  parseStoredJsonPathList,
  removeJsonPathListItem,
} from '../utils/jsonPathLists';
import { safeGetStorageItem, safeRemoveStorageItem, safeSetStorageItem } from '../utils/storage';

export interface UseJsonPathSavedQueryListsResult {
  history: string[];
  favorites: string[];
  isCurrentQueryFavorite: boolean;
  addHistoryItem: (query: string) => void;
  clearHistory: () => void;
  removeFavorite: (query: string) => void;
  removeHistoryItem: (index: number) => void;
  toggleFavorite: () => void;
}

export const useJsonPathSavedQueryLists = (
  normalizedQuery: string
): UseJsonPathSavedQueryListsResult => {
  const [history, setHistory] = useState<string[]>(() => (
    parseStoredJsonPathList(safeGetStorageItem(JSONPATH_HISTORY_STORAGE_KEY))
  ));
  const [favorites, setFavorites] = useState<string[]>(() => (
    parseStoredJsonPathList(safeGetStorageItem(JSONPATH_FAVORITES_STORAGE_KEY))
  ));

  useEffect(() => {
    safeSetStorageItem(JSONPATH_HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    safeSetStorageItem(JSONPATH_FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBackupImported = () => {
      setHistory(parseStoredJsonPathList(safeGetStorageItem(JSONPATH_HISTORY_STORAGE_KEY)));
      setFavorites(parseStoredJsonPathList(safeGetStorageItem(JSONPATH_FAVORITES_STORAGE_KEY)));
    };

    window.addEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
    return () => window.removeEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
  }, []);

  const addHistoryItem = useCallback((query: string) => {
    setHistory(prev => addJsonPathListItem(prev, query));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    safeRemoveStorageItem(JSONPATH_HISTORY_STORAGE_KEY);
  }, []);

  const removeFavorite = useCallback((query: string) => {
    setFavorites(prev => removeJsonPathListItem(prev, query));
  }, []);

  const removeHistoryItem = useCallback((index: number) => {
    setHistory(prev => prev.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  const toggleFavorite = useCallback(() => {
    if (!normalizedQuery) return;

    setFavorites(prev => (
      prev.includes(normalizedQuery)
        ? removeJsonPathListItem(prev, normalizedQuery)
        : addJsonPathListItem(prev, normalizedQuery)
    ));
  }, [normalizedQuery]);

  return {
    history,
    favorites,
    isCurrentQueryFavorite: normalizedQuery ? favorites.includes(normalizedQuery) : false,
    addHistoryItem,
    clearHistory,
    removeFavorite,
    removeHistoryItem,
    toggleFavorite,
  };
};
