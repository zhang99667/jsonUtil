import { describe, expect, it, vi } from 'vitest';
import { queryJsonPathRanges } from './jsonPathQuery';

describe('queryJsonPathRanges', () => {
  it('返回查询结果对应的高亮范围', () => {
    const jsonData = JSON.stringify({
      users: [
        { name: 'Alice' },
        { name: 'Bob' },
      ],
    }, null, 2);

    const result = queryJsonPathRanges(jsonData, '$.users[*].name');

    expect(result.totalResults).toBe(2);
    expect(result.ranges).toHaveLength(2);
    expect(result.values).toEqual(['Alice', 'Bob']);
    expect(result.items.map(item => ({ path: item.path, pointer: item.pointer, value: item.value }))).toEqual([
      { path: '$.users[0].name', pointer: '/users/0/name', value: 'Alice' },
      { path: '$.users[1].name', pointer: '/users/1/name', value: 'Bob' },
    ]);
    expect(result.ranges[0].startLine).toBeGreaterThan(0);
    expect(result.ranges[0].startColumn).toBeGreaterThan(0);
  });

  it('标准 JSON 查询复用 source map 解析结果，避免重复 JSON.parse', () => {
    const jsonData = JSON.stringify({
      users: [{ name: 'Alice' }],
    }, null, 2);
    const parseSpy = vi.spyOn(JSON, 'parse').mockImplementation(() => {
      throw new Error('不应调用额外 JSON.parse');
    });

    try {
      const result = queryJsonPathRanges(jsonData, '$.users[0].name');
      expect(result.totalResults).toBe(1);
      expect(result.values).toEqual(['Alice']);
      expect(result.ranges[0].startLine).toBeGreaterThan(0);
    } finally {
      parseSpy.mockRestore();
    }
  });

  it('支持查询特殊 key 的 bracket JSONPath', () => {
    const jsonData = JSON.stringify({
      'a.b': {
        'x/y': {
          'tilde~key': 'https://example.com/path?from=key',
        },
      },
    }, null, 2);

    const result = queryJsonPathRanges(jsonData, '$["a.b"]["x/y"]["tilde~key"]');

    expect(result.totalResults).toBe(1);
    expect(result.values).toEqual(['https://example.com/path?from=key']);
    expect(result.items[0].path).toBe('$["a.b"]["x/y"]["tilde~key"]');
    expect(result.items[0].pointer).toBe('/a.b/x~1y/tilde~0key');
    expect(result.ranges[0].startLine).toBe(4);
  });

  it('查询 k/v 形态值时返回业务标签', () => {
    const jsonData = JSON.stringify({
      extra: [
        {
          k: 'extraParam',
          v: 'https://example.com/path?from=extra',
        },
      ],
    }, null, 2);

    const result = queryJsonPathRanges(jsonData, '$.extra[0].v');

    expect(result.totalResults).toBe(1);
    expect(result.items[0]).toMatchObject({
      path: '$.extra[0].v',
      value: 'https://example.com/path?from=extra',
      sourceLabel: 'extraParam',
    });
  });

  it('查询 key/v 和 k/value 形态值时返回业务标签', () => {
    const jsonData = JSON.stringify({
      extra: [
        {
          key: 'trackingParam',
          v: 'https://example.com/path?from=tracking',
        },
        {
          k: 'buttonParam',
          value: 'cmd=%7B%22nid%22%3A123%7D',
        },
        {
          field: 'contentParam',
          content: 'raw=%7B%22nid%22%3A123%7D',
        },
      ],
    }, null, 2);

    const result = queryJsonPathRanges(jsonData, '$.extra[*].*');

    expect(result.items.filter(item => item.sourceLabel).map(item => ({
      path: item.path,
      sourceLabel: item.sourceLabel,
    }))).toEqual([
      {
        path: '$.extra[0].v',
        sourceLabel: 'trackingParam',
      },
      {
        path: '$.extra[1].value',
        sourceLabel: 'buttonParam',
      },
      {
        path: '$.extra[2].content',
        sourceLabel: 'contentParam',
      },
    ]);
  });

  it('无匹配时返回空范围', () => {
    const result = queryJsonPathRanges('{"name":"Alice"}', '$.missing');

    expect(result).toEqual({
      ranges: [],
      values: [],
      items: [],
      totalResults: 0,
      isLimited: false,
      resultLimit: 1000,
    });
  });

  it('大量命中时提前停止并仅返回前 N 项', () => {
    const jsonData = JSON.stringify({
      items: [
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ],
    }, null, 2);

    const result = queryJsonPathRanges(jsonData, '$.items[*].id', {
      resultLimit: 2,
    });

    expect(result.totalResults).toBe(2);
    expect(result.values).toEqual([1, 2]);
    expect(result.ranges).toHaveLength(2);
    expect(result.isLimited).toBe(true);
    expect(result.resultLimit).toBe(2);
  });

  it('命中数等于上限时不标记为截断', () => {
    const jsonData = JSON.stringify({
      items: [{ id: 1 }, { id: 2 }],
    }, null, 2);

    const result = queryJsonPathRanges(jsonData, '$.items[*].id', {
      resultLimit: 2,
    });

    expect(result.totalResults).toBe(2);
    expect(result.values).toEqual([1, 2]);
    expect(result.isLimited).toBe(false);
  });

  it('支持先深度格式化再查询嵌套 JSON 字符串', () => {
    const jsonData = JSON.stringify({
      payload: JSON.stringify({ user: { name: 'Alice' } }),
    });

    const result = queryJsonPathRanges(jsonData, '$.payload.user.name', {
      deepFormat: true,
    });

    expect(result.totalResults).toBe(1);
    expect(result.ranges[0]).toBeDefined();
    expect(result.values).toEqual(['Alice']);
  });

  it('支持将 JSON Lines 作为虚拟数组查询', () => {
    const jsonData = [
      '{"level":"info","user":{"id":1}}',
      '  {"level":"error","user":{"id":2}}',
    ].join('\n');

    const result = queryJsonPathRanges(jsonData, '$[*].user.id');

    expect(result.totalResults).toBe(2);
    expect(result.values).toEqual([1, 2]);
    expect(result.ranges[0].startLine).toBe(1);
    expect(result.ranges[1].startLine).toBe(2);
    expect(result.ranges[1].startColumn).toBeGreaterThan(2);
  });

  it('支持高亮 JSON Lines 中被筛选出的整行对象', () => {
    const jsonData = [
      '{"level":"info","msg":"ok"}',
      '{"level":"error","msg":"failed"}',
    ].join('\n');

    const result = queryJsonPathRanges(jsonData, '$[?(@.level=="error")]');

    expect(result.totalResults).toBe(1);
    expect(result.values).toEqual([{ level: 'error', msg: 'failed' }]);
    expect(result.ranges[0].startLine).toBe(2);
    expect(result.ranges[0].startColumn).toBe(1);
  });

  it('JSON Lines 默认根查询高亮虚拟数组覆盖的原始行范围', () => {
    const jsonData = [
      '  {"id":1}',
      '{"id":2}',
    ].join('\n');

    const result = queryJsonPathRanges(jsonData, '$');

    expect(result.totalResults).toBe(1);
    expect(result.values).toEqual([[{ id: 1 }, { id: 2 }]]);
    expect(result.ranges[0]).toEqual({
      startLine: 1,
      startColumn: 3,
      endLine: 2,
      endColumn: 9,
    });
  });

  it('非法 JSON 抛出可展示错误', () => {
    expect(() => queryJsonPathRanges('{invalid}', '$'))
      .toThrow('JSON 解析错误');
  });

  it('非法 JSONPath 抛出可展示错误', () => {
    expect(() => queryJsonPathRanges('{"users":[{"age":18}]}', '$.users[?(@.age >)]'))
      .toThrow('JSONPath 查询错误');
  });
});
