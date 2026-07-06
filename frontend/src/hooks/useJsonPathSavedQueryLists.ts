import { useCallback, useEffect, useState } from 'react';
import { APP_BACKUP_IMPORTED_EVENT } from '../utils/appBackup';
import {
  addJsonPathHistoryItem,
  clearJsonPathHistory,
  removeJsonPathFavorite,
  removeJsonPathHistoryItem,
  toggleJsonPathFavorite,
} from '../utils/jsonPathSavedQueryListActions';
import {
  clearStoredJsonPathHistory,
  loadJsonPathSavedQueryLists,
  saveJsonPathFavorites,
  saveJsonPathHistory,
} from '../utils/jsonPathSavedQueryStorage';

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
  const [lists, setLists] = useState(loadJsonPathSavedQueryLists);
  const { history, favorites } = lists;

  useEffect(() => {
    saveJsonPathHistory(history);
  }, [history]);

  useEffect(() => {
    saveJsonPathFavorites(favorites);
  }, [favorites]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBackupImported = () => {
      setLists(loadJsonPathSavedQueryLists());
    };

    window.addEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
    return () => window.removeEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
  }, []);

  const addHistoryItem = useCallback((query: string) => {
    setLists(prev => addJsonPathHistoryItem(prev, query));
  }, []);

  const clearHistory = useCallback(() => {
    setLists(clearJsonPathHistory);
    clearStoredJsonPathHistory();
  }, []);

  const removeFavorite = useCallback((query: string) => {
    setLists(prev => removeJsonPathFavorite(prev, query));
  }, []);

  const removeHistoryItem = useCallback((index: number) => {
    setLists(prev => removeJsonPathHistoryItem(prev, index));
  }, []);

  const toggleFavorite = useCallback(() => {
    if (!normalizedQuery) return;

    setLists(prev => toggleJsonPathFavorite(prev, normalizedQuery));
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
