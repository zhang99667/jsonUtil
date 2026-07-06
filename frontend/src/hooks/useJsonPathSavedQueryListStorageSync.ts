import { useEffect } from 'react';
import { APP_BACKUP_IMPORTED_EVENT } from '../utils/appBackup';
import {
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
