import { beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_BACKUP_IMPORTED_EVENT } from '../utils/appBackup';
import {
  clearStoredJsonPathHistory,
  saveJsonPathFavorites,
  saveJsonPathHistory,
} from '../utils/jsonPathSavedQueryStorage';
import { createJsonPathSavedQueryListStorageSyncTestHarness } from './useJsonPathSavedQueryListStorageSyncTestHarness';

const reactMocks = vi.hoisted(() => ({ useEffect: vi.fn() }));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: reactMocks.useEffect,
}));

vi.mock('../utils/jsonPathSavedQueryStorage', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/jsonPathSavedQueryStorage')>(),
  clearStoredJsonPathHistory: vi.fn(),
  loadJsonPathSavedQueryLists: vi.fn(),
  saveJsonPathFavorites: vi.fn(),
  saveJsonPathHistory: vi.fn(),
}));

describe('useJsonPathSavedQueryListStorageSync', () => {
  const harness = createJsonPathSavedQueryListStorageSyncTestHarness(reactMocks);

  beforeEach(() => {
    vi.clearAllMocks();
    harness.reset();
  });

  it('持久化当前历史和收藏列表', () => {
    harness.useRenderSync({ history: ['$.history'], favorites: ['$.favorite'] });

    expect(saveJsonPathHistory).toHaveBeenCalledWith(['$.history']);
    expect(saveJsonPathFavorites).toHaveBeenCalledWith(['$.favorite']);
  });

  it('空历史时清理历史存储项', () => {
    harness.useRenderSync({ history: [] });

    expect(clearStoredJsonPathHistory).toHaveBeenCalledTimes(1);
    expect(saveJsonPathHistory).not.toHaveBeenCalled();
  });

  it('配置备份导入后从存储刷新列表', () => {
    const onBackupImported = vi.fn();

    harness.useRenderSync({ onBackupImported });
    harness.triggerBackupImported();

    expect(onBackupImported).toHaveBeenCalledWith({ history: ['$.importedHistory'], favorites: ['$.importedFavorite'] });
  });

  it('卸载时移除备份导入监听', () => {
    harness.useRenderSync();
    harness.runCleanup();

    expect(window.removeEventListener).toHaveBeenCalledWith(APP_BACKUP_IMPORTED_EVENT, harness.backupImportedHandler);
  });

  it('无 window 环境下不注册备份导入监听', () => {
    vi.unstubAllGlobals();

    harness.useRenderSync();

    expect(harness.backupImportedHandler).toBeNull();
  });
});
