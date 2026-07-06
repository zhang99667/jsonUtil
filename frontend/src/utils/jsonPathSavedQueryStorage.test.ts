import { describe, expect, it } from 'vitest';
import {
  clearStoredJsonPathHistory,
  loadJsonPathSavedQueryLists,
  normalizeJsonPathSavedQueryLists,
  saveJsonPathFavorites,
  saveJsonPathHistory,
  writeJsonPathSavedQueryLists,
} from './jsonPathSavedQueryStorage';
import { MemoryStorage } from './memoryStorageTestHelper';

describe('jsonPathSavedQueryStorage', () => {
  it('读取保存的 JSONPath 历史和收藏', () => {
    const storage = new MemoryStorage();
    storage.setItem('jsonpath-query-history', JSON.stringify(['$.history']));
    storage.setItem('jsonpath-query-favorites', JSON.stringify(['$.favorite']));

    expect(loadJsonPathSavedQueryLists(storage)).toEqual({
      history: ['$.history'],
      favorites: ['$.favorite'],
    });
  });

  it('保存和清理历史收藏时沿用既有 storage key', () => {
    const storage = new MemoryStorage();

    saveJsonPathHistory(['$.history'], storage);
    saveJsonPathFavorites(['$.favorite'], storage);
    expect(JSON.parse(storage.getItem('jsonpath-query-history') || '[]')).toEqual(['$.history']);
    expect(JSON.parse(storage.getItem('jsonpath-query-favorites') || '[]')).toEqual(['$.favorite']);

    clearStoredJsonPathHistory(storage);
    expect(storage.getItem('jsonpath-query-history')).toBeNull();
  });

  it('归一化导入列表时去空白、去重并过滤非法值', () => {
    expect(normalizeJsonPathSavedQueryLists({
      history: [' $.a ', '$.a', 1],
      favorites: ['$.b', '', '$.b'],
    })).toEqual({
      history: ['$.a'],
      favorites: ['$.b'],
    });
  });

  it('备份导入写入时保持 JSON 数组格式', () => {
    const storage = new MemoryStorage();

    writeJsonPathSavedQueryLists(storage, {
      history: ['$.history'],
      favorites: ['$.favorite'],
    });

    expect(JSON.parse(storage.getItem('jsonpath-query-history') || '[]')).toEqual(['$.history']);
    expect(JSON.parse(storage.getItem('jsonpath-query-favorites') || '[]')).toEqual(['$.favorite']);
  });
});
