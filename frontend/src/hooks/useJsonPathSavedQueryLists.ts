import { useCallback, useState } from 'react';
import {
  addJsonPathHistoryItem,
  clearJsonPathHistory,
  removeJsonPathFavorite,
  removeJsonPathHistoryItem,
  toggleJsonPathFavorite,
} from '../utils/jsonPathSavedQueryListActions';
import {
  loadJsonPathSavedQueryLists,
} from '../utils/jsonPathSavedQueryStorage';
import { useJsonPathSavedQueryListStorageSync } from './useJsonPathSavedQueryListStorageSync';

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

  useJsonPathSavedQueryListStorageSync({
    history,
    favorites,
    onBackupImported: setLists,
  });

  const addHistoryItem = useCallback((query: string) => {
    setLists(prev => addJsonPathHistoryItem(prev, query));
  }, []);

  const clearHistory = useCallback(() => {
    setLists(clearJsonPathHistory);
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
