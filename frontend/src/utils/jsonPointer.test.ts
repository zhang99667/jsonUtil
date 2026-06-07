import { describe, expect, it } from 'vitest';
import { setJsonPointerValue } from './jsonPointer';

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
