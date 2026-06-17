import { describe, expect, it } from 'vitest';
import {
  buildGeneratedListSourceText,
  buildJsonPathPerformanceCaseResult,
  formatJsonPathPerformanceBudgetMarkdown,
  JSONPATH_PERFORMANCE_BUDGET_KIND,
  parseCliArgs,
} from './jsonpath-performance-budget.mjs';

const createQueryResult = overrides => ({
  totalResults: 10,
  ranges: Array.from({ length: 10 }, () => ({
    startLine: 1,
    startColumn: 1,
    endLine: 1,
    endColumn: 2,
  })),
  values: [],
  items: [],
  isLimited: false,
  resultLimit: 1000,
  ...overrides,
});

describe('buildGeneratedListSourceText', () => {
  it('生成可用于大量命中预算的列表 JSON', () => {
    const parsed = JSON.parse(buildGeneratedListSourceText(3));

    expect(parsed.items).toEqual([
      { id: 1, name: 'item-1', group: 0 },
      { id: 2, name: 'item-2', group: 1 },
      { id: 3, name: 'item-3', group: 2 },
    ]);
  });
});

describe('buildJsonPathPerformanceCaseResult', () => {
  it('汇总 JSONPath 查询耗时和命中质量', () => {
    const result = buildJsonPathPerformanceCaseResult({
      caseConfig: {
        name: 'response-50kb-scheme-search',
        source: 'corpus-response',
        query: '$..scheme',
        resultLimit: 1000,
        maxDurationMs: 200,
        minResults: 2,
        minRanges: 2,
        expectLimited: false,
      },
      responseBytes: 51_200,
      durations: [10, 30, 20],
      queryResult: createQueryResult(),
    });

    expect(result).toMatchObject({
      name: 'response-50kb-scheme-search',
      pass: true,
      durationMs: {
        median: 20,
        max: 30,
        budget: 200,
      },
      queryResult: {
        totalResults: 10,
        rangeCount: 10,
        isLimited: false,
      },
    });
  });

  it('预算超限时保留失败原因', () => {
    const result = buildJsonPathPerformanceCaseResult({
      caseConfig: {
        name: 'result-limit-8k-list',
        source: 'generated-list',
        query: '$.items[*].id',
        resultLimit: 1000,
        maxDurationMs: 20,
        minResults: 1000,
        minRanges: 1000,
        expectLimited: true,
      },
      responseBytes: 320_000,
      durations: [30],
      queryResult: createQueryResult({
        totalResults: 10,
        ranges: [],
        isLimited: false,
      }),
    });

    expect(result.pass).toBe(false);
    expect(result.failures.map(item => item.key)).toEqual([
      'durationMs',
      'results',
      'ranges',
      'isLimited',
    ]);
  });
});

describe('formatJsonPathPerformanceBudgetMarkdown', () => {
  it('输出可读 Markdown 摘要', () => {
    const markdown = formatJsonPathPerformanceBudgetMarkdown({
      kind: JSONPATH_PERFORMANCE_BUDGET_KIND,
      sample: 'reward-response-redacted',
      iterations: 3,
      summary: {
        pass: true,
        caseCount: 1,
        failed: 0,
      },
      cases: [{
        name: 'response-50kb-scheme-search',
        source: 'corpus-response',
        query: '$..scheme',
        responseBytes: 51_200,
        durationMs: {
          median: 20,
          max: 30,
          budget: 2000,
        },
        resultLimit: 1000,
        queryResult: {
          totalResults: 10,
          rangeCount: 10,
          isLimited: false,
        },
        pass: true,
        failures: [],
      }],
    });

    expect(markdown).toContain('# JSONPath 性能预算');
    expect(markdown).toContain('- 结果: PASS');
    expect(markdown).toContain('| response-50kb-scheme-search | corpus-response | $..scheme | 51200 | 20ms | 30ms | 2000ms | 10 | 10 | 1000 | 否 | PASS |');
  });
});

describe('parseCliArgs', () => {
  it('解析 CLI 参数', () => {
    expect(parseCliArgs([
      '--sample',
      'reward-response',
      '--iterations',
      '5',
      '--strict',
      '--output',
      'perf.json',
      '--summary',
      'perf.md',
    ])).toEqual({
      sampleFilter: 'reward-response',
      iterations: 5,
      strict: true,
      outputPath: 'perf.json',
      summaryPath: 'perf.md',
    });
  });

  it('位置参数可作为样本名', () => {
    expect(parseCliArgs(['reward-response'])).toMatchObject({
      sampleFilter: 'reward-response',
      iterations: 3,
    });
  });

  it('非法 iterations 给出明确错误', () => {
    expect(() => parseCliArgs(['--iterations', '0'])).toThrow('--iterations 需要正整数');
  });
});
