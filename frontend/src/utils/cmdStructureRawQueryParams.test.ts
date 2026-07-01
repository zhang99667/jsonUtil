import { describe, expect, it } from 'vitest';
import { parseCmdStructureRawQueryParams } from './cmdStructureRawQueryParams';

describe('cmdStructureRawQueryParams', () => {
  it('去掉 query 前缀并用调用方 parser 解析 value', () => {
    const result = parseCmdStructureRawQueryParams('?url=https%3A%2F%2Fexample.com%2Flanding', 2, (value, key, depth) => ({
      key,
      value,
      depth,
    }));

    expect(result).toEqual({
      url: {
        key: 'url',
        value: 'https://example.com/landing',
        depth: 3,
      },
    });
  });

  it('重复 key 按出现顺序聚合为数组', () => {
    const result = parseCmdStructureRawQueryParams('foo=bar&foo=baz&foo=qux', 0, value => value.toUpperCase());

    expect(result).toEqual({
      foo: ['BAR', 'BAZ', 'QUX'],
    });
  });
});
