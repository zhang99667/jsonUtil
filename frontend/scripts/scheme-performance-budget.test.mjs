import { describe, expect, it } from 'vitest';
import {
  buildPerformanceCaseResult,
  buildSizedResponseText,
  formatPerformanceBudgetMarkdown,
  parseCliArgs,
  percentile,
  SCHEME_PERFORMANCE_BUDGET_KIND,
} from './scheme-performance-budget.mjs';

const createReport = overrides => ({
  coverage: {
    score: 100,
  },
  summary: {
    recordCount: 2,
    placeholderCount: 3,
    unresolvedCount: 0,
    warningCount: 0,
  },
  cmdStructureCount: 1,
  nestedCommandFieldCount: 20,
  nestedResourceFieldCount: 4,
  ...overrides,
});

describe('buildSizedResponseText', () => {
  it('将 JSON object 扩充到目标大小附近', () => {
    const text = buildSizedResponseText(JSON.stringify({ errno: 0, data: { ok: true } }), 2048);

    expect(Buffer.byteLength(text, 'utf8')).toBeGreaterThanOrEqual(2048);
    expect(JSON.parse(text)).toMatchObject({
      errno: 0,
      data: {
        ok: true,
      },
    });
  });

  it('拒绝非 object 输入，避免生成无法代表 response 的样本', () => {
    expect(() => buildSizedResponseText('[1,2,3]', 2048)).toThrow('performance source 必须是 JSON object');
  });
});

describe('percentile', () => {
  it('计算排序后的百分位值', () => {
    expect(percentile([30, 10, 20], 0.5)).toBe(20);
    expect(percentile([30, 10, 20], 0.95)).toBe(30);
  });
});

describe('buildPerformanceCaseResult', () => {
  it('汇总耗时预算和解析质量指标', () => {
    const result = buildPerformanceCaseResult({
      caseConfig: {
        name: 'response-50kb',
        targetBytes: 50 * 1024,
        maxDurationMs: 3_000,
        maxUnresolved: 0,
        maxWarnings: 0,
      },
      responseBytes: 51_200,
      durations: [10, 30, 20],
      report: createReport(),
    });

    expect(result).toMatchObject({
      name: 'response-50kb',
      pass: true,
      durationMs: {
        median: 20,
        max: 30,
        budget: 3000,
      },
      quality: {
        coverageScore: 100,
        records: 2,
        cmdStructures: 1,
        nestedResourceFields: 4,
        runtimePlaceholders: 3,
        unresolved: 0,
        warnings: 0,
      },
    });
  });

  it('预算超限时保留失败原因', () => {
    const result = buildPerformanceCaseResult({
      caseConfig: {
        name: 'response-250kb',
        targetBytes: 250 * 1024,
        maxDurationMs: 100,
        maxUnresolved: 0,
        maxWarnings: 0,
      },
      responseBytes: 256_000,
      durations: [120],
      report: createReport({
        summary: {
          recordCount: 2,
          placeholderCount: 3,
          unresolvedCount: 1,
          warningCount: 1,
        },
      }),
    });

    expect(result.pass).toBe(false);
    expect(result.failures.map(item => item.key)).toEqual([
      'durationMs',
      'unresolved',
      'warnings',
    ]);
  });
});

describe('formatPerformanceBudgetMarkdown', () => {
  it('输出可读 Markdown 摘要', () => {
    const markdown = formatPerformanceBudgetMarkdown({
      kind: SCHEME_PERFORMANCE_BUDGET_KIND,
      sample: 'reward-response-redacted',
      iterations: 3,
      summary: {
        pass: true,
        caseCount: 1,
        failed: 0,
      },
      cases: [{
        name: 'response-50kb',
        responseBytes: 51_200,
        durationMs: {
          median: 20,
          max: 30,
          budget: 3000,
        },
        pass: true,
        failures: [],
        quality: {
          coverageScore: 100,
          records: 2,
          cmdStructures: 1,
          nestedResourceFields: 4,
          unresolved: 0,
          warnings: 0,
        },
      }],
    });

    expect(markdown).toContain('# Scheme 解析性能预算');
    expect(markdown).toContain('- 结果: PASS');
    expect(markdown).toContain('| response-50kb | 51200 | 20ms | 30ms | 3000ms');
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
