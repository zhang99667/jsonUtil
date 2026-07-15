import { describe, expect, it } from 'vitest';
import {
  appendJsonPointerSegment,
  decodeJsonPointerSegment,
  encodeJsonPointerSegment,
  getJsonPointerValue,
  setJsonPointerValue,
  stringifyJsonPointerValue,
} from './jsonPointer';

describe('jsonPointer helpers', () => {
  it('编码和解码 JSON Pointer segment', () => {
    expect(encodeJsonPointerSegment('a/b~c')).toBe('a~1b~0c');
    expect(decodeJsonPointerSegment('a~1b~0c')).toBe('a/b~c');
    expect(appendJsonPointerSegment('/root', 'a/b~c')).toBe('/root/a~1b~0c');
    expect(appendJsonPointerSegment('', '')).toBe('/');
  });

  it('按 JSON Pointer 读取和序列化值', () => {
    const root = {
      user: {
        name: 'Alice',
        'a/b~c': true,
      },
      items: [{ id: 1 }],
    };

    expect(getJsonPointerValue(root, '')).toBe(root);
    expect(getJsonPointerValue(root, '/user/a~1b~0c')).toBe(true);
    expect(getJsonPointerValue(root, '/items/0/id')).toBe(1);
    expect(stringifyJsonPointerValue(root, '/user/name')).toBe('"Alice"');
    expect(stringifyJsonPointerValue(root, '/items/0', { pretty: true })).toBe(JSON.stringify({
      id: 1,
    }, null, 2));
  });

  it('非法读取路径抛出错误', () => {
    expect(() => getJsonPointerValue({ items: [] }, 'items')).toThrow('非法 JSON Pointer');
    expect(() => getJsonPointerValue({ items: [] }, '/items/0')).toThrow('数组下标越界');
    expect(() => getJsonPointerValue({ user: {} }, '/user/name')).toThrow('无法继续访问');
  });
});

describe('setJsonPointerValue', () => {
  it('按对象路径替换值', () => {
    const root = { data: { url: 'old' } };

    expect(setJsonPointerValue(root, '/data/url', 'new')).toEqual({
      data: { url: 'new' },
    });
  });

  it('支持数组下标', () => {
    const root = { items: [{ url: 'first' }, { url: 'old' }] };

    expect(setJsonPointerValue(root, '/items/1/url', 'new')).toEqual({
      items: [{ url: 'first' }, { url: 'new' }],
    });
  });

  it('支持特殊 key 的 JSON Pointer 转义', () => {
    const root = {
      'a.b': {
        'x/y': {
          'tilde~key': 'old',
        },
      },
    };

    expect(setJsonPointerValue(root, '/a.b/x~1y/tilde~0key', 'new')).toEqual({
      'a.b': {
        'x/y': {
          'tilde~key': 'new',
        },
      },
    });
  });

  it('支持替换根节点', () => {
    expect(setJsonPointerValue({ url: 'old' }, '', 'new')).toBe('new');
  });

  it('非法路径抛出错误', () => {
    expect(() => setJsonPointerValue(['old'], '/a', 'new')).toThrow('非法数组下标');
    expect(() => setJsonPointerValue('old', '/url', 'new')).toThrow('无法写入');
  });
});
