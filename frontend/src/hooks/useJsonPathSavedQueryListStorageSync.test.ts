import { beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_BACKUP_IMPORTED_EVENT } from '../utils/appBackup';
import { loadJsonPathSavedQueryLists, saveJsonPathFavorites, saveJsonPathHistory } from '../utils/jsonPathSavedQueryStorage';
import { useJsonPathSavedQueryListStorageSync } from './useJsonPathSavedQueryListStorageSync';

const reactMocks = vi.hoisted(() => ({ useEffect: vi.fn() }));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: reactMocks.useEffect,
}));

vi.mock('../utils/jsonPathSavedQueryStorage', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/jsonPathSavedQueryStorage')>(),
  loadJsonPathSavedQueryLists: vi.fn(),
  saveJsonPathFavorites: vi.fn(),
  saveJsonPathHistory: vi.fn(),
}));

describe('useJsonPathSavedQueryListStorageSync', () => {
  let backupImportedHandler: (() => void) | null = null;
  let cleanup: (() => void) | undefined;

  const useRenderSync = (overrides: Partial<Parameters<typeof useJsonPathSavedQueryListStorageSync>[0]> = {}) => useJsonPathSavedQueryListStorageSync({
    history: [],
    favorites: [],
    onBackupImported: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    backupImportedHandler = null;
    cleanup = undefined;

    vi.stubGlobal('window', {
      addEventListener: vi.fn((eventName: string, handler: () => void) => {
        if (eventName === APP_BACKUP_IMPORTED_EVENT) backupImportedHandler = handler;
      }),
      removeEventListener: vi.fn(),
    });

    reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => {
      const effectCleanup = effect();
      if (typeof effectCleanup === 'function') cleanup = effectCleanup;
      return effectCleanup;
    });
    vi.mocked(loadJsonPathSavedQueryLists).mockReturnValue({ history: ['$.importedHistory'], favorites: ['$.importedFavorite'] });
  });

  it('持久化当前历史和收藏列表', () => {
    useRenderSync({ history: ['$.history'], favorites: ['$.favorite'] });

    expect(saveJsonPathHistory).toHaveBeenCalledWith(['$.history']);
    expect(saveJsonPathFavorites).toHaveBeenCalledWith(['$.favorite']);
  });

  it('配置备份导入后从存储刷新列表', () => {
    const onBackupImported = vi.fn();

    useRenderSync({ onBackupImported }); backupImportedHandler?.();

    expect(onBackupImported).toHaveBeenCalledWith({ history: ['$.importedHistory'], favorites: ['$.importedFavorite'] });
  });

  it('卸载时移除备份导入监听', () => {
    useRenderSync();
    cleanup?.();

    expect(window.removeEventListener).toHaveBeenCalledWith(APP_BACKUP_IMPORTED_EVENT, backupImportedHandler);
  });

  it('无 window 环境下不注册备份导入监听', () => {
    vi.unstubAllGlobals();

    useRenderSync();

    expect(backupImportedHandler).toBeNull();
  });
});
