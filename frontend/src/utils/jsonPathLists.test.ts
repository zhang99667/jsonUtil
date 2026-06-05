import { describe, expect, it } from 'vitest';
import {
  addJsonPathListItem,
  normalizeJsonPathList,
  parseStoredJsonPathList,
  removeJsonPathListItem,
} from './jsonPathLists';

describe('normalizeJsonPathList', () => {
  it('过滤非法项、空白项并去重', () => {
    expect(normalizeJsonPathList([' $.a ', '', '$.a', 1, '$.b'])).toEqual(['$.a', '$.b']);
  });

  it('按上限截断列表', () => {
    expect(normalizeJsonPathList(['$.a', '$.b', '$.c'], 2)).toEqual(['$.a', '$.b']);
  });
});

describe('parseStoredJsonPathList', () => {
  it('解析合法存储内容', () => {
    expect(parseStoredJsonPathList(JSON.stringify(['$.a']))).toEqual(['$.a']);
  });

  it('存储内容损坏时返回空列表', () => {
    expect(parseStoredJsonPathList('{bad')).toEqual([]);
  });
});

describe('addJsonPathListItem', () => {
  it('新增查询放到列表顶部', () => {
    expect(addJsonPathListItem(['$.a'], '$.b')).toEqual(['$.b', '$.a']);
  });

  it('重复查询移动到列表顶部', () => {
    expect(addJsonPathListItem(['$.a', '$.b'], '$.b')).toEqual(['$.b', '$.a']);
  });
});

describe('removeJsonPathListItem', () => {
  it('移除指定查询', () => {
    expect(removeJsonPathListItem(['$.a', '$.b'], '$.a')).toEqual(['$.b']);
  });
});
