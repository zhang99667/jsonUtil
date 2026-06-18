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
  topResourceTypes: [
    {
      resourceType: 'video',
      resourceTypeLabel: '视频',
      count: 1,
      percentage: 100,
      recordCount: 1,
      schemaCount: 1,
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
    ignoredExtraPaths: 0,
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

  it('识别 cmdHandler 忽略 extra 路径增加和减少', () => {
    const before = createSample({
      cmdHandlerAlignment: {
        pass: true,
        ignoredExtraPaths: 2,
        diff: {
          ignoredExtraPaths: ['$.old.keep', '$.old.resolved'],
        },
      },
    });
    const after = createSample({
      cmdHandlerAlignment: {
        pass: true,
        ignoredExtraPaths: 8,
        diff: {
          ignoredExtraPaths: ['$.old.keep', '$.new.path'],
        },
      },
    });
    const diff = buildSampleSnapshotDiff(before, after);
    const recoveredDiff = buildSampleSnapshotDiff(after, before);

    expect(diff.status).toBe('changed');
    expect(diff.metrics.cmdHandlerIgnoredExtraPaths).toEqual({
      before: 2,
      after: 8,
      delta: 6,
    });
    expect(diff.regressions).toContainEqual({
      key: 'cmdHandlerIgnoredExtraPaths',
      message: 'cmdHandler 忽略 extra 路径增加',
      before: 2,
      after: 8,
    });
    expect(diff.cmdHandler.ignoredExtraPaths).toEqual({
      lost: ['$.old.resolved'],
      gained: ['$.new.path'],
    });
    expect(recoveredDiff.improvements).toContainEqual({
      key: 'cmdHandlerIgnoredExtraPaths',
      message: 'cmdHandler 忽略 extra 路径减少',
      before: 8,
      after: 2,
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

  it('识别静态资源类型占比变化但不作为质量退化', () => {
    const before = createSample({
      topResourceTypes: [
        {
          resourceType: 'image',
          resourceTypeLabel: '图片',
          count: 4,
          percentage: 66.7,
          recordCount: 1,
          schemaCount: 4,
        },
        {
          resourceType: 'video',
          resourceTypeLabel: '视频',
          count: 2,
          percentage: 33.3,
          recordCount: 1,
          schemaCount: 2,
        },
      ],
    });
    const after = createSample({
      topResourceTypes: [
        {
          resourceType: 'image',
          resourceTypeLabel: '图片',
          count: 3,
          percentage: 50,
          recordCount: 1,
          schemaCount: 3,
        },
        {
          resourceType: 'lottie',
          resourceTypeLabel: 'Lottie',
          count: 3,
          percentage: 50,
          recordCount: 1,
          schemaCount: 3,
        },
      ],
    });
    const diff = buildSampleSnapshotDiff(before, after);

    expect(diff.status).toBe('changed');
    expect(diff.regressions).toEqual([]);
    expect(diff.resourceTypes.changed).toEqual([
      {
        resourceType: 'image',
        resourceTypeLabel: '图片',
        before: before.topResourceTypes[0],
        after: after.topResourceTypes[0],
        countDelta: -1,
        percentageDelta: -16.7,
      },
    ]);
    expect(diff.resourceTypes.gained).toEqual([after.topResourceTypes[1]]);
    expect(diff.resourceTypes.lost).toEqual([before.topResourceTypes[1]]);
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

  it('新增样本存在基线或 cmdHandler 问题时标记为退化', () => {
    const added = buildSampleSnapshotDiff(undefined, createSample({
      sample: 'new-sample',
      baseline: {
        expectedSnapshot: false,
        expectedSnapshotFile: 'new-sample.expected.snapshot.json',
      },
      cmdHandlerAlignment: {
        pass: false,
        reason: 'missingActualCmdStructure',
      },
    }));

    expect(added.status).toBe('added');
    expect(added.regressions).toEqual(expect.arrayContaining([
      {
        key: 'baseline',
        message: '新增样本缺失 expected snapshot',
        before: undefined,
        after: 'new-sample.expected.snapshot.json',
      },
      {
        key: 'cmdHandler',
        message: '新增样本 cmdHandler 对齐失败',
        before: undefined,
        after: 'missingActualCmdStructure',
      },
    ]));
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

  it('资源类型占比超过可选阈值时标记为退化', () => {
    const before = createSnapshot([createSample({
      topResourceTypes: [
        {
          resourceType: 'video',
          resourceTypeLabel: '视频',
          count: 4,
          percentage: 80,
          recordCount: 2,
          schemaCount: 4,
        },
        {
          resourceType: 'image',
          resourceTypeLabel: '图片',
          count: 1,
          percentage: 20,
          recordCount: 1,
          schemaCount: 1,
        },
      ],
    })]);
    const after = createSnapshot([createSample({
      topResourceTypes: [
        {
          resourceType: 'video',
          resourceTypeLabel: '视频',
          count: 2,
          percentage: 40,
          recordCount: 1,
          schemaCount: 2,
        },
        {
          resourceType: 'lottie',
          resourceTypeLabel: 'Lottie',
          count: 3,
          percentage: 60,
          recordCount: 2,
          schemaCount: 3,
        },
      ],
    })]);
    const diff = buildSnapshotDiff(before, after, {
      resourceTypeThresholds: [
        { resourceType: 'video', direction: 'drop', percentagePoints: 30 },
        { resourceType: 'Lottie', direction: 'rise', percentagePoints: 30 },
      ],
    });

    expect(diff.summary).toMatchObject({
      pass: false,
      regressions: 2,
    });
    expect(diff.resourceTypeThresholds).toEqual([
      { resourceType: 'video', direction: 'drop', percentagePoints: 30 },
      { resourceType: 'Lottie', direction: 'rise', percentagePoints: 30 },
    ]);
    expect(diff.samples[0].regressions).toEqual(expect.arrayContaining([
      {
        key: 'resourceTypePercentageDrop',
        message: '资源类型占比下降超过阈值: 视频',
        before: {
          resourceType: 'video',
          resourceTypeLabel: '视频',
          percentage: 80,
        },
        after: {
          resourceType: 'video',
          resourceTypeLabel: '视频',
          percentage: 40,
          percentageDelta: -40,
          thresholdPercentagePoints: 30,
        },
      },
      {
        key: 'resourceTypePercentageRise',
        message: '资源类型占比上升超过阈值: Lottie',
        before: {
          resourceType: 'Lottie',
          resourceTypeLabel: 'Lottie',
          percentage: 0,
        },
        after: {
          resourceType: 'Lottie',
          resourceTypeLabel: 'Lottie',
          percentage: 60,
          percentageDelta: 60,
          thresholdPercentagePoints: 30,
        },
      },
    ]));
  });

  it('after 快照整体失败时即使样本指标未退化也标记失败', () => {
    const before = createSnapshot([createSample()]);
    const after = {
      ...createSnapshot([createSample()]),
      thresholdSummary: {
        pass: false,
        missingBaselines: [
          {
            sample: 'new-response-redacted',
            expectedSnapshot: 'new-response.expected.snapshot.json',
          },
        ],
        failures: [],
        required: { failures: [] },
        cmdHandler: { failures: [] },
      },
    };
    const diff = buildSnapshotDiff(before, after);

    expect(diff.summary).toMatchObject({
      pass: false,
      regressions: 1,
    });
    expect(diff.snapshotRegressions).toEqual([
      {
        key: 'missingBaselines',
        message: 'after 快照存在缺失基线',
        before: 0,
        after: 1,
      },
    ]);
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
    expect(markdown).toContain('忽略 extra');
    expect(markdown).toContain('必需项失败');
    expect(markdown).toContain('## 退化明细');
    expect(markdown).toContain('覆盖率下降');
  });

  it('输出快照级退化明细', () => {
    const before = createSnapshot([createSample()]);
    const after = {
      ...createSnapshot([createSample()]),
      thresholdSummary: {
        pass: false,
        missingBaselines: [
          {
            sample: 'new-response-redacted',
            expectedSnapshot: 'new-response.expected.snapshot.json',
          },
        ],
      },
    };
    const markdown = formatSnapshotDiffMarkdown(buildSnapshotDiff(before, after));

    expect(markdown).toContain('## 快照级退化');
    expect(markdown).toContain('after 快照存在缺失基线');
  });

  it('输出 cmdHandler ignored extra 路径变化样例', () => {
    const before = createSnapshot([createSample({
      cmdHandlerAlignment: {
        pass: true,
        ignoredExtraPaths: 2,
        diff: {
          ignoredExtraPaths: ['$.old.keep', '$.old.resolved'],
        },
      },
    })]);
    const after = createSnapshot([createSample({
      cmdHandlerAlignment: {
        pass: true,
        ignoredExtraPaths: 3,
        diff: {
          ignoredExtraPaths: ['$.old.keep', '$.new.path', '$.new.more'],
        },
      },
    })]);
    const markdown = formatSnapshotDiffMarkdown(buildSnapshotDiff(before, after));

    expect(markdown).toContain('## cmdHandler ignored extra 路径变化');
    expect(markdown).toContain('- 新增 ignored extra 路径样例:');
    expect(markdown).toContain('  - $.new.path');
    expect(markdown).toContain('  - $.new.more');
    expect(markdown).toContain('- 消失 ignored extra 路径样例:');
    expect(markdown).toContain('  - $.old.resolved');
  });

  it('输出静态资源类型占比变化', () => {
    const before = createSnapshot([createSample({
      topResourceTypes: [
        {
          resourceType: 'image',
          resourceTypeLabel: '图片',
          count: 4,
          percentage: 66.7,
          recordCount: 1,
          schemaCount: 4,
        },
        {
          resourceType: 'video',
          resourceTypeLabel: '视频',
          count: 2,
          percentage: 33.3,
          recordCount: 1,
          schemaCount: 2,
        },
      ],
    })]);
    const after = createSnapshot([createSample({
      topResourceTypes: [
        {
          resourceType: 'image',
          resourceTypeLabel: '图片',
          count: 3,
          percentage: 50,
          recordCount: 1,
          schemaCount: 3,
        },
        {
          resourceType: 'lottie',
          resourceTypeLabel: 'Lottie',
          count: 3,
          percentage: 50,
          recordCount: 1,
          schemaCount: 3,
        },
      ],
    })]);
    const markdown = formatSnapshotDiffMarkdown(buildSnapshotDiff(before, after));

    expect(markdown).toContain('## 静态资源类型占比变化');
    expect(markdown).toContain('- 图片: 图片 66.7% ×4（URL 4 / 来源记录 1） -> 图片 50% ×3（URL 3 / 来源记录 1）（占比 -16.7，次数 -1）');
    expect(markdown).toContain('- 新增类型: Lottie 50% ×3（URL 3 / 来源记录 1）');
    expect(markdown).toContain('- 消失类型: 视频 33.3% ×2（URL 2 / 来源记录 1）');
  });

  it('输出资源类型阈值摘要', () => {
    const before = createSnapshot([createSample({
      topResourceTypes: [
        {
          resourceType: 'video',
          resourceTypeLabel: '视频',
          count: 4,
          percentage: 80,
          recordCount: 2,
          schemaCount: 4,
        },
      ],
    })]);
    const after = createSnapshot([createSample({
      topResourceTypes: [
        {
          resourceType: 'video',
          resourceTypeLabel: '视频',
          count: 2,
          percentage: 40,
          recordCount: 1,
          schemaCount: 2,
        },
      ],
    })]);
    const markdown = formatSnapshotDiffMarkdown(buildSnapshotDiff(before, after, {
      resourceTypeThresholds: [
        { resourceType: 'video', direction: 'drop', percentagePoints: 30 },
      ],
    }));

    expect(markdown).toContain('- 资源类型阈值: video 下降 30 个百分点');
    expect(markdown).toContain('资源类型占比下降超过阈值: 视频');
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
      resourceTypeThresholds: [],
      strict: true,
    });
  });

  it('解析资源类型占比阈值参数', () => {
    expect(parseCliArgs([
      '--before',
      'before.json',
      '--after',
      'after.json',
      '--resource-type-drop',
      'video=20,image=15',
      '--resource-type-rise',
      'lottie=25',
    ])).toMatchObject({
      resourceTypeThresholds: [
        { resourceType: 'video', direction: 'drop', percentagePoints: 20 },
        { resourceType: 'image', direction: 'drop', percentagePoints: 15 },
        { resourceType: 'lottie', direction: 'rise', percentagePoints: 25 },
      ],
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
