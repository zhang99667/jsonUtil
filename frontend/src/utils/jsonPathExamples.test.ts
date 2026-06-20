import { describe, expect, it } from 'vitest';
import { getJsonPathScenarioExamples } from './jsonPathExamples';
import { queryJsonPathRanges } from './jsonPathQuery';

describe('getJsonPathScenarioExamples', () => {
  it('根据根对象数组推荐遍历、提取、过滤和递归查询', () => {
    const source = JSON.stringify({
      items: [
        { id: 1, status: 'ok', title: 'A', traceId: 't1' },
        { id: 2, status: 'fail', title: 'B', traceId: 't2' },
      ],
      meta: {
        traceId: 'root-trace',
      },
    });
    const examples = getJsonPathScenarioExamples(source);

    expect(examples.map(example => example.query)).toEqual([
      '$.items[*]',
      '$.items[*].id',
      '$.items[?(@.status == "ok")]',
      '$..traceId',
    ]);
    expect(examples.map(example => queryJsonPathRanges(source, example.query).totalResults)).toEqual([2, 2, 1, 3]);
    expect(examples[0]).toMatchObject({
      label: '遍历 items',
      description: '查看 items 下的 2 个对象项',
    });
  });

  it('根数组会优先推荐根数组遍历并按布尔字段过滤', () => {
    const examples = getJsonPathScenarioExamples(JSON.stringify([
      { name: 'first', enabled: true },
      { name: 'second', enabled: false },
    ]));

    expect(examples.map(example => example.query)).toEqual([
      '$[*]',
      '$[*].name',
      '$[?(@.enabled == true)]',
      '$..enabled',
    ]);
    expect(examples[0].label).toBe('根数组');
  });

  it('特殊字段名使用安全 JSONPath 写法', () => {
    const examples = getJsonPathScenarioExamples(JSON.stringify({
      rows: [
        { 'trace.id': 'a', 'button-cmd': 'open', score: 1 },
        { 'trace.id': 'b', 'button-cmd': 'close', score: 2 },
      ],
      extra: {
        'trace.id': 'root',
      },
    }));

    expect(examples.map(example => example.query)).toContain('$.rows[*]["button-cmd"]');
    expect(examples.map(example => example.query)).toContain('$..["trace.id"]');
  });

  it('非法或超大输入不生成场景示例', () => {
    expect(getJsonPathScenarioExamples('{bad')).toEqual([]);
    expect(getJsonPathScenarioExamples(' '.repeat(321_000) + '{}')).toEqual([]);
  });
});
