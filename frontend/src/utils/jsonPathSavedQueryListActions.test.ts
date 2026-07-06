import { describe, expect, it } from 'vitest';
import {
  addJsonPathHistoryItem,
  clearJsonPathHistory,
  removeJsonPathFavorite,
  removeJsonPathHistoryItem,
  toggleJsonPathFavorite,
} from './jsonPathSavedQueryListActions';

describe('jsonPathSavedQueryListActions', () => {
  it('新增历史时去重并保留收藏列表', () => {
    expect(addJsonPathHistoryItem({ history: ['$.old', '$.new'], favorites: ['$.fav'] }, '$.new'))
      .toEqual({ history: ['$.new', '$.old'], favorites: ['$.fav'] });
  });

  it('清空和删除历史只影响历史列表', () => {
    const lists = { history: ['$.a', '$.b'], favorites: ['$.fav'] };

    expect(clearJsonPathHistory(lists)).toEqual({ history: [], favorites: ['$.fav'] });
    expect(removeJsonPathHistoryItem(lists, 0)).toEqual({ history: ['$.b'], favorites: ['$.fav'] });
  });

  it('移除和切换收藏只影响收藏列表', () => {
    const lists = { history: ['$.history'], favorites: ['$.a', '$.b'] };

    expect(removeJsonPathFavorite(lists, '$.a')).toEqual({
      history: ['$.history'],
      favorites: ['$.b'],
    });
    expect(toggleJsonPathFavorite(lists, '$.c')).toEqual({
      history: ['$.history'],
      favorites: ['$.c', '$.a', '$.b'],
    });
    expect(toggleJsonPathFavorite(lists, '$.a')).toEqual({
      history: ['$.history'],
      favorites: ['$.b'],
    });
  });
});
