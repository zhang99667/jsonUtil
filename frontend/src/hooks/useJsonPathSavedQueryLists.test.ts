import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  JSONPATH_FAVORITES_STORAGE_KEY,
  JSONPATH_HISTORY_STORAGE_KEY,
} from '../utils/jsonPathLists';
import { safeGetStorageItem, safeRemoveStorageItem, safeSetStorageItem } from '../utils/storage';
import { APP_BACKUP_IMPORTED_EVENT } from '../utils/appBackup';
import { useJsonPathSavedQueryLists } from './useJsonPathSavedQueryLists';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
  useEffect: vi.fn(),
  useState: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useEffect: reactMocks.useEffect,
  useState: reactMocks.useState,
}));

vi.mock('../utils/storage', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/storage')>(),
  safeGetStorageItem: vi.fn(),
  safeRemoveStorageItem: vi.fn(),
  safeSetStorageItem: vi.fn(),
}));

describe('useJsonPathSavedQueryLists', () => {
  const setters: Array<ReturnType<typeof vi.fn>> = [];
  let backupImportedHandler: (() => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    setters.length = 0;
    backupImportedHandler = null;

    vi.stubGlobal('window', {
      addEventListener: vi.fn((eventName: string, handler: () => void) => {
        if (eventName === APP_BACKUP_IMPORTED_EVENT) {
          backupImportedHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
    });

    vi.mocked(safeGetStorageItem).mockImplementation(key => {
      if (key === JSONPATH_HISTORY_STORAGE_KEY) return JSON.stringify(['$.history']);
      if (key === JSONPATH_FAVORITES_STORAGE_KEY) return JSON.stringify(['$.favorite']);
      return null;
    });
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => effect());
    reactMocks.useState.mockImplementation((initializer: unknown) => {
      const value = typeof initializer === 'function'
        ? (initializer as () => unknown)()
        : initializer;
      const setter = vi.fn();
      setters.push(setter);
      return [value, setter];
    });
  });

  it('从本地存储初始化收藏和历史，并持久化当前列表', () => {
    const lists = useJsonPathSavedQueryLists('$.favorite');

    expect(lists.history).toEqual(['$.history']);
    expect(lists.favorites).toEqual(['$.favorite']);
    expect(lists.isCurrentQueryFavorite).toBe(true);
    expect(safeSetStorageItem).toHaveBeenCalledWith(
      JSONPATH_HISTORY_STORAGE_KEY,
      JSON.stringify(['$.history'])
    );
    expect(safeSetStorageItem).toHaveBeenCalledWith(
      JSONPATH_FAVORITES_STORAGE_KEY,
      JSON.stringify(['$.favorite'])
    );
  });

  it('提供历史和收藏的增删操作', () => {
    const lists = useJsonPathSavedQueryLists('$.new');

    lists.addHistoryItem('$.new');
    expect(setters[0].mock.calls[0][0](['$.old'])).toEqual(['$.new', '$.old']);

    lists.removeHistoryItem(0);
    expect(setters[0].mock.calls[1][0](['$.old', '$.next'])).toEqual(['$.next']);

    lists.toggleFavorite();
    expect(setters[1].mock.calls[0][0](['$.old'])).toEqual(['$.new', '$.old']);
    expect(setters[1].mock.calls[0][0](['$.new', '$.old'])).toEqual(['$.old']);

    lists.removeFavorite('$.old');
    expect(setters[1].mock.calls[1][0](['$.old', '$.new'])).toEqual(['$.new']);
  });

  it('清空历史时同步删除存储项', () => {
    const lists = useJsonPathSavedQueryLists('$.favorite');

    lists.clearHistory();

    expect(setters[0]).toHaveBeenCalledWith([]);
    expect(safeRemoveStorageItem).toHaveBeenCalledWith(JSONPATH_HISTORY_STORAGE_KEY);
  });

  it('配置备份导入后刷新已挂载面板中的列表', () => {
    vi.mocked(safeGetStorageItem).mockImplementation(key => {
      if (key === JSONPATH_HISTORY_STORAGE_KEY) return JSON.stringify(['$.importedHistory']);
      if (key === JSONPATH_FAVORITES_STORAGE_KEY) return JSON.stringify(['$.importedFavorite']);
      return null;
    });

    useJsonPathSavedQueryLists('$.favorite');
    backupImportedHandler?.();

    expect(setters[0]).toHaveBeenCalledWith(['$.importedHistory']);
    expect(setters[1]).toHaveBeenCalledWith(['$.importedFavorite']);
  });
});
