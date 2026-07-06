import { useCallback, useEffect, useState } from 'react';
import { APP_BACKUP_IMPORTED_EVENT } from '../utils/appBackup';
import {
  addJsonPathListItem,
  removeJsonPathListItem,
} from '../utils/jsonPathLists';
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
    setLists(prev => ({ ...prev, history: addJsonPathListItem(prev.history, query) }));
  }, []);

  const clearHistory = useCallback(() => {
    setLists(prev => ({ ...prev, history: [] }));
    clearStoredJsonPathHistory();
  }, []);

  const removeFavorite = useCallback((query: string) => {
    setLists(prev => ({ ...prev, favorites: removeJsonPathListItem(prev.favorites, query) }));
  }, []);

  const removeHistoryItem = useCallback((index: number) => {
    setLists(prev => ({ ...prev, history: prev.history.filter((_, itemIndex) => itemIndex !== index) }));
  }, []);

  const toggleFavorite = useCallback(() => {
    if (!normalizedQuery) return;

    setLists(prev => ({
      ...prev,
      favorites: prev.favorites.includes(normalizedQuery)
        ? removeJsonPathListItem(prev.favorites, normalizedQuery)
        : addJsonPathListItem(prev.favorites, normalizedQuery),
    }));
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
