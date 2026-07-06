import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearStoredJsonPathHistory, loadJsonPathSavedQueryLists, saveJsonPathFavorites, saveJsonPathHistory } from '../utils/jsonPathSavedQueryStorage';
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

vi.mock('../utils/jsonPathSavedQueryStorage', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/jsonPathSavedQueryStorage')>(),
  clearStoredJsonPathHistory: vi.fn(),
  loadJsonPathSavedQueryLists: vi.fn(),
  saveJsonPathFavorites: vi.fn(),
  saveJsonPathHistory: vi.fn(),
}));

describe('useJsonPathSavedQueryLists', () => {
  let setLists: ReturnType<typeof vi.fn>;
  let backupImportedHandler: (() => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    setLists = vi.fn();
    backupImportedHandler = null;

    vi.stubGlobal('window', {
      addEventListener: vi.fn((eventName: string, handler: () => void) => {
        if (eventName === APP_BACKUP_IMPORTED_EVENT) {
          backupImportedHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
    });

    vi.mocked(loadJsonPathSavedQueryLists).mockReturnValue({ history: ['$.history'], favorites: ['$.favorite'] });
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => effect());
    reactMocks.useState.mockImplementation((initializer: unknown) => {
      const value = typeof initializer === 'function'
        ? (initializer as () => unknown)()
        : initializer;
      return [value, setLists];
    });
  });

  it('从本地存储初始化收藏和历史，并持久化当前列表', () => {
    const lists = useJsonPathSavedQueryLists('$.favorite');

    expect(lists.history).toEqual(['$.history']);
    expect(lists.favorites).toEqual(['$.favorite']);
    expect(lists.isCurrentQueryFavorite).toBe(true);
    expect(saveJsonPathHistory).toHaveBeenCalledWith(['$.history']);
    expect(saveJsonPathFavorites).toHaveBeenCalledWith(['$.favorite']);
  });

  it('提供历史和收藏的增删操作', () => {
    const lists = useJsonPathSavedQueryLists('$.new');

    lists.addHistoryItem('$.new');
    expect(setLists.mock.calls[0][0]({ history: ['$.old'], favorites: [] })).toEqual({
      history: ['$.new', '$.old'], favorites: [],
    });
    lists.removeHistoryItem(0);
    lists.removeFavorite('$.old');
    lists.toggleFavorite();

    expect(setLists).toHaveBeenCalledTimes(4);
  });

  it('清空历史时同步删除存储项', () => {
    const lists = useJsonPathSavedQueryLists('$.favorite');

    lists.clearHistory();

    expect(setLists.mock.calls[0][0]({ history: ['$.old'], favorites: ['$.favorite'] })).toEqual({
      history: [], favorites: ['$.favorite'],
    });
    expect(clearStoredJsonPathHistory).toHaveBeenCalledTimes(1);
  });

  it('配置备份导入后刷新已挂载面板中的列表', () => {
    vi.mocked(loadJsonPathSavedQueryLists)
      .mockReturnValueOnce({ history: ['$.history'], favorites: ['$.favorite'] })
      .mockReturnValueOnce({ history: ['$.importedHistory'], favorites: ['$.importedFavorite'] });

    useJsonPathSavedQueryLists('$.favorite');
    backupImportedHandler?.();

    expect(setLists).toHaveBeenCalledWith({ history: ['$.importedHistory'], favorites: ['$.importedFavorite'] });
  });
});
