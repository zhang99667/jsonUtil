import { describe, expect, it } from 'vitest';
import type {
  TransformSchemeParamStageSummary,
  TransformSchemeParamStageSummarySample,
  TransformStep,
} from '../types';
import {
  buildSchemeParamStageQualityBuckets,
  getRecordSchemeParamStageSummary,
  getSchemeParamStageSearchText,
  getTransformStepLabel,
  sumNonReversibleParamStageCount,
  sumSchemeParamStageCount,
  sumSchemeParamStageRepairHintCount,
  type TransformSchemeParamStageRecord,
} from './transformSchemeParamStages';

const createSample = (
  index: number,
  overrides: Partial<TransformSchemeParamStageSummarySample> = {}
): TransformSchemeParamStageSummarySample => ({
  path: `$.cmd.param${index}`,
  key: `param${index}`,
  source: 'query',
  lengths: {
    encodedInput: 10,
    decodedInput: 8,
    expandedOutput: 20,
    encodedOutput: 24,
  },
  reversible: index % 2 === 0,
  hasRepairHint: Boolean(overrides.repairHint),
  ...overrides,
});

const createSummary = (
  overrides: Partial<TransformSchemeParamStageSummary> = {}
): TransformSchemeParamStageSummary => ({
  total: 0,
  repairHints: 0,
  nonReversible: 0,
  sources: [],
  keys: [],
  repairHintLabels: [],
  samples: [],
  ...overrides,
});

describe('transformSchemeParamStages', () => {
  it('生成转换步骤标签并保留 Scheme 可回写信息', () => {
    expect(getTransformStepLabel({ type: 'json_parse' })).toBe('嵌套 JSON');
    expect(getTransformStepLabel({
      type: 'scheme_decode',
      originalSchemeType: 'query-string',
      originalSchemeReversible: false,
    })).toBe('CMD 参数 · 不可逆');
    expect(getTransformStepLabel({
      type: 'scheme_decode',
      originalSchemeType: 'url',
    })).toBe('URL Scheme · 可回写');
  });

  it('合并同一路径上的参数分层摘要并限制样本数', () => {
    const steps: TransformStep[] = [
      {
        type: 'scheme_decode',
        schemeParamStageSummary: createSummary({
          total: 2,
          repairHints: 1,
          nonReversible: 1,
          sources: [{ key: 'query', count: 2 }],
          keys: [{ key: 'cmd', count: 2 }],
          repairHintLabels: [{ key: '补右括号', count: 1 }],
          samples: Array.from({ length: 6 }, (_, index) => createSample(index)),
        }),
      },
      {
        type: 'scheme_decode',
        schemeParamStageSummary: createSummary({
          total: 4,
          repairHints: 2,
          nonReversible: 3,
          sources: [{ key: 'query', count: 1 }, { key: 'fragment', count: 3 }],
          keys: [{ key: 'cmd', count: 1 }, { key: 'ext', count: 3 }],
          repairHintLabels: [{ key: '补右括号', count: 2 }],
          samples: Array.from({ length: 6 }, (_, index) => createSample(index + 10)),
        }),
      },
    ];

    expect(getRecordSchemeParamStageSummary({ steps })).toEqual({
      total: 6,
      repairHints: 3,
      nonReversible: 4,
      sources: [{ key: 'fragment', count: 3 }, { key: 'query', count: 3 }],
      keys: [{ key: 'cmd', count: 3 }, { key: 'ext', count: 3 }],
      repairHintLabels: [{ key: '补右括号', count: 3 }],
      samples: [
        createSample(0),
        createSample(1),
        createSample(2),
        createSample(3),
        createSample(4),
        createSample(5),
        createSample(10),
        createSample(11),
      ],
    });
  });

  it('统计参数层总量、修复提示和不可回写数量', () => {
    const records: TransformSchemeParamStageRecord[] = [
      { path: '$.one', schemeParamStageSummary: createSummary({ total: 2, repairHints: 1, nonReversible: 1 }) },
      { path: '$.two' },
      { path: '$.three', schemeParamStageSummary: createSummary({ total: 5, repairHints: 3, nonReversible: 2 }) },
    ];

    expect(sumSchemeParamStageCount(records)).toBe(7);
    expect(sumSchemeParamStageRepairHintCount(records)).toBe(4);
    expect(sumNonReversibleParamStageCount(records)).toBe(3);
  });

  it('构建质量快照 Bucket 并限制路径数量', () => {
    const records: TransformSchemeParamStageRecord[] = [
      { path: '$.one', schemeParamStageSummary: createSummary({ keys: [{ key: 'cmd', count: 2 }] }) },
      { path: '$.one', schemeParamStageSummary: createSummary({ keys: [{ key: 'cmd', count: 3 }] }) },
      { path: '$.two', schemeParamStageSummary: createSummary({ keys: [{ key: 'cmd', count: 1 }, { key: 'ext', count: 2 }] }) },
      { path: '$.three', schemeParamStageSummary: createSummary({ keys: [{ key: 'cmd', count: 1 }] }) },
      { path: '$.four', schemeParamStageSummary: createSummary({ keys: [{ key: 'cmd', count: 1 }] }) },
      { path: '$.five', schemeParamStageSummary: createSummary({ keys: [{ key: 'cmd', count: 1 }] }) },
    ];

    expect(buildSchemeParamStageQualityBuckets(records, summary => summary.keys)).toEqual([
      { key: 'cmd', count: 9, paths: ['$.one', '$.two', '$.three', '$.four'] },
      { key: 'ext', count: 2, paths: ['$.two'] },
    ]);
  });

  it('生成参数分层搜索文本', () => {
    const summary = createSummary({
      sources: [{ key: 'query', count: 1 }],
      keys: [{ key: 'cmd', count: 1 }],
      repairHintLabels: [{ key: '补右括号', count: 1 }],
      samples: [createSample(1, {
        source: 'fragment',
        reversible: false,
        repairHint: '补全 JSON 右括号',
      })],
    });

    expect(getSchemeParamStageSearchText(undefined)).toBe('');
    expect(getSchemeParamStageSearchText(summary)).toContain('param stage');
    expect(getSchemeParamStageSearchText(summary)).toContain('补全 JSON 右括号');
    expect(getSchemeParamStageSearchText(summary)).toContain('不可回写');
  });
});
