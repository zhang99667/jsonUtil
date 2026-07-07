import { expect, vi } from 'vitest';
import { APP_BACKUP_IMPORTED_EVENT } from '../utils/appBackup';
import { loadJsonPathSavedQueryLists } from '../utils/jsonPathSavedQueryStorage';
import { useJsonPathSavedQueryListStorageSync } from './useJsonPathSavedQueryListStorageSync';

type StorageSyncOptions = Parameters<typeof useJsonPathSavedQueryListStorageSync>[0];

interface ReactEffectMock { useEffect: ReturnType<typeof vi.fn>; }

export const createJsonPathSavedQueryListStorageSyncTestHarness = (reactMocks: ReactEffectMock) => {
  let backupImportedHandler: (() => void) | null = null;
  let cleanup: (() => void) | undefined;

  const useRenderSync = (overrides: Partial<StorageSyncOptions> = {}) => useJsonPathSavedQueryListStorageSync({
    history: [],
    favorites: [],
    onBackupImported: vi.fn(),
    ...overrides,
  });
  const useRenderSyncWithoutWindow = (overrides: Partial<StorageSyncOptions> = {}) => {
    vi.unstubAllGlobals();
    useRenderSync(overrides);
  };

  const reset = () => {
    backupImportedHandler = null; cleanup = undefined;

    vi.stubGlobal('window', {
      addEventListener: vi.fn((eventName: string, handler: () => void) => eventName === APP_BACKUP_IMPORTED_EVENT && (backupImportedHandler = handler)),
      removeEventListener: vi.fn(),
    });

    reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => {
      const effectCleanup = effect();
      if (typeof effectCleanup === 'function') cleanup = effectCleanup;
      return effectCleanup;
    });
    vi.mocked(loadJsonPathSavedQueryLists).mockReturnValue({ history: ['$.importedHistory'], favorites: ['$.importedFavorite'] });
  };

  return {
    expectBackupImportedListenerRemoved: () => expect(window.removeEventListener).toHaveBeenCalledWith(APP_BACKUP_IMPORTED_EVENT, backupImportedHandler),
    expectNoBackupImportedListener: () => expect(backupImportedHandler).toBeNull(),
    reset,
    runCleanup: () => cleanup?.(),
    triggerBackupImported: () => backupImportedHandler?.(),
    useRenderSync,
    useRenderSyncWithoutWindow,
  };
};
