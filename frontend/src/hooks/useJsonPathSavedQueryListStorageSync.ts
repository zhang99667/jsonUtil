import { useEffect } from 'react';
import { APP_BACKUP_IMPORTED_EVENT } from '../utils/appBackup';
import {
  clearStoredJsonPathHistory,
  loadJsonPathSavedQueryLists,
  saveJsonPathFavorites,
  saveJsonPathHistory,
  type JsonPathSavedQueryLists,
} from '../utils/jsonPathSavedQueryStorage';

interface UseJsonPathSavedQueryListStorageSyncOptions {
  history: string[];
  favorites: string[];
  onBackupImported: (lists: JsonPathSavedQueryLists) => void;
}

export const useJsonPathSavedQueryListStorageSync = ({
  history,
  favorites,
  onBackupImported,
}: UseJsonPathSavedQueryListStorageSyncOptions): void => {
  useEffect(() => {
    if (history.length === 0) {
      clearStoredJsonPathHistory();
      return;
    }

    saveJsonPathHistory(history);
  }, [history]);

  useEffect(() => {
    saveJsonPathFavorites(favorites);
  }, [favorites]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBackupImported = () => {
      onBackupImported(loadJsonPathSavedQueryLists());
    };

    window.addEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
    return () => window.removeEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
  }, [onBackupImported]);
};
