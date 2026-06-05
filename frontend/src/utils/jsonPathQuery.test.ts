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

  it('非法 JSON 抛出可展示错误', () => {
    expect(() => queryJsonPathRanges('{invalid}', '$'))
      .toThrow('JSON 解析错误');
  });

  it('非法 JSONPath 抛出可展示错误', () => {
    expect(() => queryJsonPathRanges('{"users":[{"age":18}]}', '$.users[?(@.age >)]'))
      .toThrow('JSONPath 查询错误');
  });
});
