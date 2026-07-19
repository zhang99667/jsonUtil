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

  it('默认最多保留前十项', () => {
    const items = Array.from({ length: 12 }, (_, index) => `item-${index}`);

    expect(normalizeRecentStringList(items)).toEqual(items.slice(0, 10));
  });

  it('保留首次出现顺序并区分大小写', () => {
    expect(normalizeRecentStringList([' A ', 'a', 'A', ' B '])).toEqual(['A', 'a', 'B']);
  });

  it('按上限截断列表', () => {
    expect(normalizeRecentStringList(['a', 'b', 'c'], 2)).toEqual(['a', 'b']);
  });

  it('小数上限先截断为整数', () => {
    expect(normalizeRecentStringList(['a', 'b', 'c'], 1.5)).toEqual(['a']);
  });

  it('非正数和非有限上限返回空列表', () => {
    for (const limit of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(normalizeRecentStringList(['a', 'b'], limit)).toEqual([]);
    }
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

  it('新增内容默认最多保留十项', () => {
    const items = Array.from({ length: 12 }, (_, index) => `item-${index}`);

    expect(addRecentStringListItem(items, 'first')).toEqual(['first', ...items.slice(0, 9)]);
  });

  it('上限生效后不读取原列表尾部', () => {
    const items = ['a', 'b'];
    Object.defineProperty(items, 2, {
      get: () => {
        throw new Error('不应读取原列表尾部');
      },
    });

    expect(addRecentStringListItem(items, 'first', 2)).toEqual(['first', 'a']);
  });

  it('重复内容移动到列表顶部', () => {
    expect(addRecentStringListItem(['trace.id', 'phone'], 'phone')).toEqual(['phone', 'trace.id']);
  });

  it('新增内容置顶后复用统一归一化规则', () => {
    expect(addRecentStringListItem([' a ', 'b', 'a', 'c'], ' a ', 3)).toEqual(['a', 'b', 'c']);
  });

  it('空白新增内容只归一原列表', () => {
    expect(addRecentStringListItem([' a ', '', 'a', 'b'], '   ')).toEqual(['a', 'b']);
  });

  it('小数上限先截断为整数', () => {
    expect(addRecentStringListItem(['b', 'c'], 'a', 1.5)).toEqual(['a']);
  });

  it('非正数和非有限上限返回空列表', () => {
    for (const limit of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(addRecentStringListItem(['b', 'c'], 'a', limit)).toEqual([]);
    }
  });
});

describe('removeRecentStringListItem', () => {
  it('移除指定内容', () => {
    expect(removeRecentStringListItem(['trace.id', 'phone'], 'trace.id')).toEqual(['phone']);
  });
});
