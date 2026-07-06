import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadJsonPathSavedQueryLists } from '../utils/jsonPathSavedQueryStorage';
import { useJsonPathSavedQueryLists } from './useJsonPathSavedQueryLists';
import { useJsonPathSavedQueryListStorageSync } from './useJsonPathSavedQueryListStorageSync';

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
  loadJsonPathSavedQueryLists: vi.fn(),
}));

vi.mock('./useJsonPathSavedQueryListStorageSync', () => ({
  useJsonPathSavedQueryListStorageSync: vi.fn(),
}));

describe('useJsonPathSavedQueryLists', () => {
  let setLists: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    setLists = vi.fn();

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

  it('从本地存储初始化收藏和历史，并接通存储同步', () => {
    const lists = useJsonPathSavedQueryLists('$.favorite');

    expect(lists.history).toEqual(['$.history']);
    expect(lists.favorites).toEqual(['$.favorite']);
    expect(lists.isCurrentQueryFavorite).toBe(true);
    expect(useJsonPathSavedQueryListStorageSync).toHaveBeenCalledWith({
      history: ['$.history'],
      favorites: ['$.favorite'],
      onBackupImported: setLists,
    });
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

  it('清空历史时仅更新列表状态', () => {
    const lists = useJsonPathSavedQueryLists('$.favorite');

    lists.clearHistory();

    expect(setLists.mock.calls[0][0]({ history: ['$.old'], favorites: ['$.favorite'] })).toEqual({
      history: [], favorites: ['$.favorite'],
    });
  });

  it('空查询不会切换收藏状态', () => {
    const lists = useJsonPathSavedQueryLists('');

    lists.toggleFavorite();

    expect(lists.isCurrentQueryFavorite).toBe(false);
    expect(setLists).not.toHaveBeenCalled();
  });
});
