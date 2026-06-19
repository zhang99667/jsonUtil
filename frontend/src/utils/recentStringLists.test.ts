import { describe, expect, it } from 'vitest';
import {
  addRecentStringListItem,
  normalizeRecentStringList,
  parseStoredRecentStringList,
  removeRecentStringListItem,
} from './recentStringLists';

describe('normalizeRecentStringList', () => {
  it('过滤非法项、空白项并去重', () => {
    expect(normalizeRecentStringList([' trace.id ', '', 'trace.id', 1, 'phone'])).toEqual(['trace.id', 'phone']);
  });

  it('按上限截断列表', () => {
    expect(normalizeRecentStringList(['a', 'b', 'c'], 2)).toEqual(['a', 'b']);
  });
});

describe('parseStoredRecentStringList', () => {
  it('解析合法存储内容', () => {
    expect(parseStoredRecentStringList(JSON.stringify(['cmdSchema']))).toEqual(['cmdSchema']);
  });

  it('存储内容损坏时返回空列表', () => {
    expect(parseStoredRecentStringList('{bad')).toEqual([]);
  });
});

describe('addRecentStringListItem', () => {
  it('新增内容放到列表顶部', () => {
    expect(addRecentStringListItem(['trace.id'], 'phone')).toEqual(['phone', 'trace.id']);
  });

  it('重复内容移动到列表顶部', () => {
    expect(addRecentStringListItem(['trace.id', 'phone'], 'phone')).toEqual(['phone', 'trace.id']);
  });
});

describe('removeRecentStringListItem', () => {
  it('移除指定内容', () => {
    expect(removeRecentStringListItem(['trace.id', 'phone'], 'trace.id')).toEqual(['phone']);
  });
});
