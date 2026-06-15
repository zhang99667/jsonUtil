import { describe, expect, it } from 'vitest';
import {
  buildSnapshotDiff,
  buildSampleSnapshotDiff,
  formatSnapshotDiffMarkdown,
  parseCliArgs,
  SCHEME_CORPUS_SNAPSHOT_DIFF_KIND,
  SCHEME_CORPUS_SNAPSHOT_KIND,
} from './scheme-corpus-snapshot-diff.mjs';

const createSample = (overrides = {}) => ({
  sample: 'reward-response-redacted',
  coverage: {
    score: 100,
    level: 'success',
  },
  totals: {
    records: 2,
    cmdStructures: 1,
    nestedCommandFields: 20,
    nestedResourceFields: 1,
    runtimePlaceholders: 3,
    unresolved: 0,
    warnings: 0,
  },
  topCommandSchemas: [
    {
      schema: 'nadcorevendor://vendor/ad/rewardImpl',
      count: 1,
    },
  ],
  topResourceSchemas: [
    {
      schema: 'https://video.example.com/ad.mp4',
      count: 1,
    },
  ],
  thresholds: {
    minCoverageScore: {
      actual: 100,
      expected: 100,
      pass: true,
    },
  },
  requiredChecks: {
    requiredCommandSchemas: {
      actual: ['nadcorevendor://vendor/ad/rewardImpl'],
      expected: ['nadcorevendor://vendor/ad/rewardImpl'],
      missing: [],
      pass: true,
    },
  },
  cmdHandlerAlignment: {
    pass: true,
  },
  ...overrides,
});

const createSnapshot = samples => ({
  schemaVersion: 1,
  kind: SCHEME_CORPUS_SNAPSHOT_KIND,
  sampleCount: samples.length,
  thresholdSummary: {
    pass: true,
  },
  samples,
});

describe('buildSampleSnapshotDiff', () => {
  it('识别解析质量提升且不判定为退化', () => {
    const before = createSample({
      coverage: { score: 80 },
      totals: {
        records: 1,
        cmdStructures: 1,
        nestedCommandFields: 8,
        nestedResourceFields: 0,
        runtimePlaceholders: 3,
        unresolved: 1,
        warnings: 1,
      },
      topResourceSchemas: [],
      cmdHandlerAlignment: {
        pass: false,
      },
    });
    const after = createSample();
    const diff = buildSampleSnapshotDiff(before, after);

    expect(diff.status).toBe('changed');
    expect(diff.regressions).toEqual([]);
    expect(diff.improvements.map(item => item.key)).toEqual(expect.arrayContaining([
      'coverage',
      'nestedCommandFields',
      'nestedResourceFields',
      'unresolved',
      'warnings',
      'resourceSchema',
      'cmdHandler',
    ]));
  });

  it('识别覆盖率下降、热点消失和 cmdHandler 退化', () => {
    const before = createSample();
    const after = createSample({
      coverage: { score: 75 },
      totals: {
        records: 2,
        cmdStructures: 0,
        nestedCommandFields: 10,
        nestedResourceFields: 0,
        runtimePlaceholders: 4,
        unresolved: 1,
        warnings: 1,
      },
      topCommandSchemas: [],
      topResourceSchemas: [],
      thresholds: {
        minCoverageScore: {
          actual: 75,
          expected: 100,
          pass: false,
        },
      },
      cmdHandlerAlignment: {
        pass: false,
      },
    });
    const diff = buildSampleSnapshotDiff(before, after);

    expect(diff.status).toBe('changed');
    expect(diff.regressions.map(item => item.key)).toEqual(expect.arrayContaining([
      'coverage',
      'cmdStructures',
      'nestedCommandFields',
      'nestedResourceFields',
      'unresolved',
      'warnings',
      'thresholds',
      'commandSchema',
      'resourceSchema',
      'cmdHandler',
    ]));
  });

  it('识别 expected 必需项失败增加和恢复', () => {
    const before = createSample();
    const after = createSample({
      requiredChecks: {
        requiredCommandSchemas: {
          actual: [],
          expected: ['nadcorevendor://vendor/ad/rewardImpl'],
          missing: ['nadcorevendor://vendor/ad/rewardImpl'],
          pass: false,
        },
      },
    });
    const diff = buildSampleSnapshotDiff(before, after);
    const recoveredDiff = buildSampleSnapshotDiff(after, before);

    expect(diff.metrics.requiredFailures).toEqual({
      before: 0,
      after: 1,
      delta: 1,
    });
    expect(diff.regressions).toContainEqual({
      key: 'requiredChecks',
      message: '新增必需项失败',
      before: undefined,
      after: 'requiredCommandSchemas missing=["nadcorevendor://vendor/ad/rewardImpl"] extra=[]',
    });
    expect(recoveredDiff.improvements).toContainEqual({
      key: 'requiredChecks',
      message: '必需项失败恢复',
      before: 'requiredCommandSchemas missing=["nadcorevendor://vendor/ad/rewardImpl"] extra=[]',
      after: undefined,
    });
  });

  it('必需项失败数量不变但失败内容变化时也标记趋势变化', () => {
    const before = createSample({
      requiredChecks: {
        requiredCommandSchemas: {
          actual: [],
          expected: ['nadcorevendor://vendor/ad/rewardImpl'],
          missing: ['nadcorevendor://vendor/ad/rewardImpl'],
          pass: false,
        },
      },
    });
    const after = createSample({
      requiredChecks: {
        scanLocations: {
          actual: [],
          expected: [{ path: '$.cmd', type: 'url' }],
          missing: [{ path: '$.cmd', type: 'url' }],
          extra: [],
          pass: false,
        },
      },
    });
    const diff = buildSampleSnapshotDiff(before, after);

    expect(diff.status).toBe('changed');
    expect(diff.metrics.requiredFailures.delta).toBe(0);
    expect(diff.regressions).toContainEqual({
      key: 'requiredChecks',
      message: '新增必需项失败',
      before: undefined,
      after: 'scanLocations missing=[{"path":"$.cmd","type":"url"}] extra=[]',
    });
    expect(diff.improvements).toContainEqual({
      key: 'requiredChecks',
      message: '必需项失败恢复',
      before: 'requiredCommandSchemas missing=["nadcorevendor://vendor/ad/rewardImpl"] extra=[]',
      after: undefined,
    });
  });

  it('识别新增和删除样本', () => {
    const added = buildSampleSnapshotDiff(undefined, createSample({ sample: 'new-sample' }));
    const removed = buildSampleSnapshotDiff(createSample({ sample: 'old-sample' }), undefined);

    expect(added.status).toBe('added');
    expect(added.metrics.coverage.after).toBe(100);
    expect(removed.status).toBe('removed');
    expect(removed.regressions[0]).toMatchObject({
      key: 'sample',
      message: '样本在 after 快照中缺失',
    });
  });
});

describe('buildSnapshotDiff', () => {
  it('汇总快照级趋势结果', () => {
    const before = createSnapshot([createSample()]);
    const after = createSnapshot([
      createSample({
        totals: {
          records: 2,
          cmdStructures: 2,
          nestedCommandFields: 30,
          nestedResourceFields: 1,
          runtimePlaceholders: 2,
          unresolved: 0,
          warnings: 0,
        },
      }),
    ]);
    const diff = buildSnapshotDiff(before, after);

    expect(diff.kind).toBe(SCHEME_CORPUS_SNAPSHOT_DIFF_KIND);
    expect(diff.summary).toMatchObject({
      pass: true,
      compared: 1,
      changed: 1,
      regressions: 0,
    });
    expect(diff.samples[0].metrics.cmdStructures.delta).toBe(1);
  });

  it('拒绝非质量快照输入', () => {
    expect(() => buildSnapshotDiff({ kind: 'other', samples: [] }, createSnapshot([])))
      .toThrow('before 不是有效的 Scheme Corpus 质量快照');
  });
});

describe('formatSnapshotDiffMarkdown', () => {
  it('输出质量趋势 Markdown 摘要', () => {
    const before = createSnapshot([createSample()]);
    const after = createSnapshot([
      createSample({
        coverage: { score: 90 },
      }),
    ]);
    const markdown = formatSnapshotDiffMarkdown(buildSnapshotDiff(before, after));

    expect(markdown).toContain('# Scheme Corpus 质量趋势');
    expect(markdown).toContain('- 结果: FAIL');
    expect(markdown).toContain('| reward-response-redacted | changed | 100 -> 90 (-10)');
    expect(markdown).toContain('必需项失败');
    expect(markdown).toContain('## 退化明细');
    expect(markdown).toContain('覆盖率下降');
  });
});

describe('parseCliArgs', () => {
  it('解析显式 before/after 参数', () => {
    expect(parseCliArgs([
      '--before',
      'before.json',
      '--after',
      'after.json',
      '--strict',
      '--output',
      'diff.json',
      '--summary',
      'diff.md',
    ])).toEqual({
      beforePath: 'before.json',
      afterPath: 'after.json',
      outputPath: 'diff.json',
      summaryPath: 'diff.md',
      strict: true,
    });
  });

  it('支持位置参数', () => {
    expect(parseCliArgs(['before.json', 'after.json'])).toMatchObject({
      beforePath: 'before.json',
      afterPath: 'after.json',
    });
  });

  it('缺少 after 时给出明确错误', () => {
    expect(() => parseCliArgs(['before.json'])).toThrow('缺少 --after 快照文件路径');
  });
});
