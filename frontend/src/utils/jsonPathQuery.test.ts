import { describe, expect, it } from 'vitest';
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
    expect(result.ranges[0].startLine).toBeGreaterThan(0);
    expect(result.ranges[0].startColumn).toBeGreaterThan(0);
  });

  it('无匹配时返回空范围', () => {
    const result = queryJsonPathRanges('{"name":"Alice"}', '$.missing');

    expect(result).toEqual({ ranges: [], values: [], totalResults: 0 });
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
