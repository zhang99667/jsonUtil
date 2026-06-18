import { describe, expect, it } from 'vitest';
import {
  applyCorpusReplacements,
  buildCorpusResponseText,
  buildCorpusSnapshotFromResponseText,
  buildCorpusSnapshotSample,
  buildCmdHandlerAlignment,
  buildRequiredResults,
  buildThresholdResults,
  buildThresholdSummary,
  formatThresholdFailure,
  formatCorpusSnapshotMarkdownSummary,
  listCmdHandlerFailures,
  listMissingBaselines,
  listRequiredFailures,
  listThresholdFailures,
  parseCliArgs,
  SCHEME_CORPUS_SNAPSHOT_KIND,
} from './scheme-corpus-snapshot.mjs';

const createReport = () => ({
  summaryText: '深度解析: 展开 2 处',
  coverage: {
    score: 100,
    label: '解析覆盖 100%',
    level: 'success',
    description: '已完全展开。',
    items: [],
  },
  summary: {
    unresolvedCount: 0,
    warningCount: 0,
  },
  cmdStructureCount: 2,
  nestedCommandFieldCount: 5,
  nestedResourceFieldCount: 1,
  records: [{
    commandSchema: 'nadcorevendor://vendor/ad/rewardImpl',
    getCmdStructureCopyText: () => JSON.stringify({
      result: {
        cmdSchema: 'nadcorevendor://vendor/ad/rewardImpl',
        cmdParams: {
          panel_cmd: {
            cmdSchema: 'baiduboxapp://v7/vendor/ad/deeplink',
          },
          extraParsedField: 'more-than-baseline',
        },
      },
    }),
  }],
  runtimePlaceholderGroups: [
    {
      value: '__CONVERT_CMD__',
      count: 2,
      sourceCount: 1,
    },
  ],
});

const createQualitySnapshot = () => ({
  totals: {
    records: 2,
    cmdStructures: 2,
    nestedCommandFields: 5,
    nestedResourceFields: 1,
    runtimePlaceholders: 2,
    unresolved: 0,
    warnings: 0,
  },
  filtered: {
    records: 2,
    cmdStructures: 2,
    nestedCommandFields: 5,
    nestedResourceFields: 1,
    runtimePlaceholders: 2,
    unresolved: 0,
    warnings: 0,
  },
  hotspots: {
    topCommandSchemas: [{
      schema: 'nadcorevendor://vendor/ad/rewardImpl',
      count: 1,
      recordCount: 1,
      paths: ['$.scheme'],
      hasMorePaths: false,
    }],
    topResourceSchemas: [{
      schema: 'https://video.example.com/ad.mp4',
      count: 1,
      recordCount: 1,
      paths: ['$.scheme.video_url'],
      hasMorePaths: false,
    }],
    topResourceTypes: [{
      resourceType: 'video',
      resourceTypeLabel: '视频',
      count: 1,
      percentage: 100,
      recordCount: 1,
      schemaCount: 1,
    }],
    topNestedCommandFields: [{
      key: 'panel_cmd',
      count: 1,
      recordCount: 1,
      paths: ['$.scheme.panel_cmd'],
      hasMorePaths: false,
    }],
    topNestedResourceFields: [{
      key: 'video_url',
      count: 1,
      recordCount: 1,
      paths: ['$.scheme.video_url'],
      hasMorePaths: false,
    }],
  },
});

const createScanLocations = () => [
  {
    path: '$.cmd',
    type: 'url',
  },
];

const createExpectedSnapshot = () => ({
  cmdHandlerExpected: 'reward-response.cmdhandler.expected.json',
  primaryCommandSchema: 'nadcorevendor://vendor/ad/rewardImpl',
  scanLocations: createScanLocations(),
  requiredCommandSchemas: ['nadcorevendor://vendor/ad/rewardImpl'],
  requiredRuntimePlaceholders: ['__CONVERT_CMD__'],
  quality: {
    minCoverageScore: 100,
    minCmdStructures: 1,
    minNestedCommandFields: 4,
    minNestedResourceFields: 1,
    maxUnresolved: 0,
    maxWarnings: 0,
    leadHotspotCommandSchema: 'nadcorevendor://vendor/ad/rewardImpl',
    leadHotspotResourceSchema: 'https://video.example.com/ad.mp4',
    leadHotspotResourceField: 'video_url',
  },
});

const createCmdHandlerExpected = () => ({
  result: {
    cmdSchema: 'nadcorevendor://vendor/ad/rewardImpl',
    cmdParams: {
      panel_cmd: {
        cmdSchema: 'baiduboxapp://v7/vendor/ad/deeplink',
      },
    },
  },
});

describe('applyCorpusReplacements', () => {
  it('递归替换 corpus 模板占位符', () => {
    expect(applyCorpusReplacements({
      scheme: '__SCHEME__',
      nested: ['keep', '__TAIL__'],
    }, {
      __SCHEME__: ['cmd=', '1'],
      __TAIL__: ['done'],
    })).toEqual({
      scheme: 'cmd=1',
      nested: ['keep', 'done'],
    });
  });
});

describe('buildCorpusResponseText', () => {
  it('生成可解析的 response 文本', () => {
    const text = buildCorpusResponseText({
      responseTemplate: {
        errno: 0,
        cmd: '__CMD__',
      },
      replacements: {
        __CMD__: ['cmd=', '1'],
      },
    });

    expect(JSON.parse(text)).toEqual({
      errno: 0,
      cmd: 'cmd=1',
    });
  });
});

describe('buildCorpusSnapshotFromResponseText', () => {
  it('支持直接从内存 response 文本生成临时输入快照', async () => {
    const snapshot = await buildCorpusSnapshotFromResponseText({
      sampleName: 'memory-response',
      responseText: JSON.stringify({
        scheme: 'nadcorevendor://vendor/ad/reward?task_params=%7B%22title%22%3A%22ok%22%7D',
      }),
    });

    expect(snapshot.source).toBe('input');
    expect(snapshot.sampleCount).toBe(1);
    expect(snapshot.samples[0].sample).toBe('memory-response');
    expect(snapshot.samples[0].coverage.score).toBeGreaterThanOrEqual(0);
  });
});

describe('buildThresholdResults', () => {
  it('输出每个 expected 阈值的 pass/fail 结果', () => {
    expect(buildThresholdResults(
      createReport(),
      createQualitySnapshot(),
      createExpectedSnapshot()
    )).toMatchObject({
      minCoverageScore: {
        actual: 100,
        expected: 100,
        pass: true,
      },
      minNestedResourceFields: {
        actual: 1,
        expected: 1,
        pass: true,
      },
      leadHotspotResourceField: {
        actual: 'video_url',
        expected: 'video_url',
        pass: true,
      },
    });
  });

  it('阈值不满足时标记为失败但保留实际值', () => {
    const report = {
      ...createReport(),
      nestedResourceFieldCount: 0,
    };

    expect(buildThresholdResults(
      report,
      createQualitySnapshot(),
      createExpectedSnapshot()
    ).minNestedResourceFields).toEqual({
      actual: 0,
      expected: 1,
      pass: false,
    });
  });

  it('校验 cmdHandler ignored extra 路径上限', () => {
    const expectedSnapshot = {
      quality: {
        maxCmdHandlerIgnoredExtraPaths: 1,
      },
    };

    expect(buildThresholdResults(
      createReport(),
      createQualitySnapshot(),
      expectedSnapshot,
      { ignoredExtraPaths: 1 }
    ).maxCmdHandlerIgnoredExtraPaths).toEqual({
      actual: 1,
      expected: 1,
      pass: true,
    });
    expect(buildThresholdResults(
      createReport(),
      createQualitySnapshot(),
      expectedSnapshot,
      { ignoredExtraPaths: 2 }
    ).maxCmdHandlerIgnoredExtraPaths).toEqual({
      actual: 2,
      expected: 1,
      pass: false,
    });
  });
});

describe('buildRequiredResults', () => {
  it('校验 expected 中声明的必需解析结果', () => {
    expect(buildRequiredResults({
      report: createReport(),
      expectedSnapshot: createExpectedSnapshot(),
      scanLocations: createScanLocations(),
    })).toMatchObject({
      requiredCommandSchemas: {
        actual: ['nadcorevendor://vendor/ad/rewardImpl'],
        expected: ['nadcorevendor://vendor/ad/rewardImpl'],
        missing: [],
        pass: true,
      },
      requiredRuntimePlaceholders: {
        actual: ['__CONVERT_CMD__'],
        expected: ['__CONVERT_CMD__'],
        missing: [],
        pass: true,
      },
      scanLocations: {
        actual: createScanLocations(),
        expected: createScanLocations(),
        missing: [],
        extra: [],
        pass: true,
      },
    });
  });

  it('必需解析结果缺失或多扫位置时标记为失败', () => {
    const expectedSnapshot = {
      scanLocations: createScanLocations(),
      requiredCommandSchemas: ['missing://schema'],
      requiredRuntimePlaceholders: ['__MISSING__'],
    };

    expect(buildRequiredResults({
      report: createReport(),
      expectedSnapshot,
      scanLocations: [
        ...createScanLocations(),
        {
          path: '$.extra',
          type: 'url',
        },
      ],
    })).toMatchObject({
      requiredCommandSchemas: {
        missing: ['missing://schema'],
        pass: false,
      },
      requiredRuntimePlaceholders: {
        missing: ['__MISSING__'],
        pass: false,
      },
      scanLocations: {
        missing: [],
        extra: [
          {
            path: '$.extra',
            type: 'url',
          },
        ],
        pass: false,
      },
    });
  });
});

describe('buildCorpusSnapshotSample', () => {
  it('汇总单个 corpus 的质量快照和阈值结果', () => {
    const sample = buildCorpusSnapshotSample({
      fixture: {
        name: 'reward-response-redacted',
        baseline: {
          expectedSnapshot: true,
          expectedSnapshotFile: 'reward-response.expected.snapshot.json',
        },
      },
      expectedSnapshot: createExpectedSnapshot(),
      cmdHandlerExpected: createCmdHandlerExpected(),
      responseText: '{"cmd":"1"}',
      report: createReport(),
      reportView: {
        isRecordTruncated: false,
        isCmdStructureTruncated: false,
        isPlaceholderTruncated: false,
        isUnresolvedTruncated: false,
        isWarningTruncated: false,
      },
      qualitySnapshot: createQualitySnapshot(),
      scanLocations: createScanLocations(),
    });

    expect(SCHEME_CORPUS_SNAPSHOT_KIND).toBe('json-helper-scheme-corpus-quality-snapshot');
    expect(sample).toMatchObject({
      sample: 'reward-response-redacted',
      baseline: {
        expectedSnapshot: true,
        expectedSnapshotFile: 'reward-response.expected.snapshot.json',
      },
      responseBytes: 11,
      totals: {
        nestedResourceFields: 1,
      },
      topResourceTypes: [{
        resourceType: 'video',
        resourceTypeLabel: '视频',
        count: 1,
        percentage: 100,
      }],
      runtimePlaceholders: [
        {
          value: '__CONVERT_CMD__',
          count: 2,
          sourceCount: 1,
        },
      ],
      scanLocations: createScanLocations(),
      thresholds: {
        leadHotspotResourceSchema: {
          pass: true,
        },
      },
      requiredChecks: {
        requiredCommandSchemas: {
          pass: true,
        },
        requiredRuntimePlaceholders: {
          pass: true,
        },
        scanLocations: {
          pass: true,
        },
      },
      cmdHandlerAlignment: {
        pass: true,
        expectedFile: 'reward-response.cmdhandler.expected.json',
        ignoreExtraPaths: true,
        missingPaths: 0,
        ignoredExtraPaths: 1,
        valueDiffs: 0,
      },
    });
  });

  it('把 cmdHandler ignored extra 上限写入样本阈值', () => {
    const expectedSnapshot = createExpectedSnapshot();
    expectedSnapshot.quality = {
      ...expectedSnapshot.quality,
      maxCmdHandlerIgnoredExtraPaths: 1,
    };

    const sample = buildCorpusSnapshotSample({
      fixture: {
        name: 'reward-response-redacted',
      },
      expectedSnapshot,
      cmdHandlerExpected: createCmdHandlerExpected(),
      responseText: '{"cmd":"1"}',
      report: createReport(),
      reportView: {
        isRecordTruncated: false,
        isCmdStructureTruncated: false,
        isPlaceholderTruncated: false,
        isUnresolvedTruncated: false,
        isWarningTruncated: false,
      },
      qualitySnapshot: createQualitySnapshot(),
      scanLocations: createScanLocations(),
    });

    expect(sample.thresholds.maxCmdHandlerIgnoredExtraPaths).toEqual({
      actual: 1,
      expected: 1,
      pass: true,
    });
  });
});

describe('buildCmdHandlerAlignment', () => {
  it('对齐 cmdHandler expected，并允许本工具多解析额外路径', () => {
    const alignment = buildCmdHandlerAlignment({
      sampleName: 'reward-response-redacted',
      report: createReport(),
      expectedSnapshot: createExpectedSnapshot(),
      cmdHandlerExpected: createCmdHandlerExpected(),
    });

    expect(alignment).toMatchObject({
      pass: true,
      expectedFile: 'reward-response.cmdhandler.expected.json',
      actualCommandSchema: 'nadcorevendor://vendor/ad/rewardImpl',
      expectedCommandSchema: 'nadcorevendor://vendor/ad/rewardImpl',
      extraPaths: 0,
      ignoredExtraPaths: 1,
      diff: {
        ignoredExtraPathCount: 1,
        ignoredExtraPaths: ['$.extraParsedField'],
      },
    });
  });

  it('关键路径缺失时标记为 cmdHandler 对齐失败', () => {
    const alignment = buildCmdHandlerAlignment({
      sampleName: 'reward-response-redacted',
      report: {
        ...createReport(),
        records: [{
          commandSchema: 'nadcorevendor://vendor/ad/rewardImpl',
          getCmdStructureCopyText: () => JSON.stringify({
            result: {
              cmdSchema: 'nadcorevendor://vendor/ad/rewardImpl',
              cmdParams: {},
            },
          }),
        }],
      },
      expectedSnapshot: createExpectedSnapshot(),
      cmdHandlerExpected: createCmdHandlerExpected(),
    });

    expect(alignment).toMatchObject({
      pass: false,
      missingPaths: 2,
      valueDiffs: 0,
      diff: {
        missingPathCount: 2,
      },
    });
  });
});

describe('buildThresholdSummary', () => {
  it('汇总全部样本的阈值失败项', () => {
    const samples = [
      {
        sample: 'pass-sample',
        thresholds: {
          minCoverageScore: {
            actual: 100,
            expected: 100,
            pass: true,
          },
        },
      },
      {
        sample: 'fail-sample',
        thresholds: {
          minNestedCommandFields: {
            actual: 3,
            expected: 4,
            pass: false,
          },
        },
      },
    ];

    expect(listThresholdFailures(samples)).toEqual([
      {
        sample: 'fail-sample',
        key: 'minNestedCommandFields',
        actual: 3,
        expected: 4,
      },
    ]);
    expect(buildThresholdSummary(samples)).toEqual({
      pass: false,
      total: 2,
      failed: 1,
      missingBaselines: [],
      failures: [
        {
          sample: 'fail-sample',
          key: 'minNestedCommandFields',
          actual: 3,
          expected: 4,
        },
      ],
      required: {
        total: 0,
        failed: 0,
        failures: [],
      },
      cmdHandler: {
        total: 0,
        failed: 0,
        ignoredExtraPaths: 0,
        failures: [],
      },
    });
  });

  it('没有阈值时视为通过', () => {
    expect(buildThresholdSummary([{ sample: 'input-response', thresholds: {} }]))
      .toEqual({
        pass: true,
        total: 0,
        failed: 0,
        missingBaselines: [],
        failures: [],
        required: {
          total: 0,
          failed: 0,
          failures: [],
        },
        cmdHandler: {
          total: 0,
          failed: 0,
          ignoredExtraPaths: 0,
          failures: [],
        },
      });
  });

  it('corpus 样本缺少 expected snapshot 时标记为失败', () => {
    const samples = [{
      sample: 'new-response-redacted',
      baseline: {
        expectedSnapshot: false,
        expectedSnapshotFile: 'new-response.expected.snapshot.json',
      },
      thresholds: {},
    }];

    expect(listMissingBaselines(samples)).toEqual([
      {
        sample: 'new-response-redacted',
        expectedSnapshot: 'new-response.expected.snapshot.json',
      },
    ]);
    expect(buildThresholdSummary(samples)).toEqual({
      pass: false,
      total: 0,
      failed: 0,
      missingBaselines: [
        {
          sample: 'new-response-redacted',
          expectedSnapshot: 'new-response.expected.snapshot.json',
        },
      ],
      failures: [],
      required: {
        total: 0,
        failed: 0,
        failures: [],
      },
      cmdHandler: {
        total: 0,
        failed: 0,
        ignoredExtraPaths: 0,
        failures: [],
      },
    });
  });

  it('corpus 样本缺少 cmdHandler expected 时标记为失败', () => {
    const samples = [{
      sample: 'new-response-redacted',
      baseline: {
        expectedSnapshot: true,
        expectedSnapshotFile: 'new-response.expected.snapshot.json',
        cmdHandlerExpected: false,
        cmdHandlerExpectedFile: 'new-response.cmdhandler.expected.json',
      },
      thresholds: {},
    }];

    expect(listMissingBaselines(samples)).toEqual([
      {
        sample: 'new-response-redacted',
        cmdHandlerExpected: 'new-response.cmdhandler.expected.json',
      },
    ]);
    expect(buildThresholdSummary(samples).pass).toBe(false);
  });

  it('汇总 expected 必需项失败项', () => {
    const samples = [{
      sample: 'reward-response-redacted',
      thresholds: {},
      requiredChecks: {
        requiredCommandSchemas: {
          actual: ['actual://schema'],
          expected: ['missing://schema'],
          missing: ['missing://schema'],
          pass: false,
        },
      },
    }];

    expect(listRequiredFailures(samples)).toEqual([
      {
        sample: 'reward-response-redacted',
        key: 'requiredCommandSchemas',
        actual: ['actual://schema'],
        expected: ['missing://schema'],
        missing: ['missing://schema'],
        extra: [],
      },
    ]);
    expect(buildThresholdSummary(samples)).toMatchObject({
      pass: false,
      required: {
        total: 1,
        failed: 1,
        failures: listRequiredFailures(samples),
      },
    });
  });

  it('汇总 cmdHandler 对齐失败项', () => {
    const samples = [{
      sample: 'reward-response-redacted',
      thresholds: {},
      cmdHandlerAlignment: {
        expectedFile: 'reward-response.cmdhandler.expected.json',
        pass: false,
        schemaDiff: false,
        sourceDiff: false,
        missingPaths: 1,
        extraPaths: 0,
        ignoredExtraPaths: 2,
        valueDiffs: 0,
      },
    }];

    expect(listCmdHandlerFailures(samples)).toEqual([
      {
        sample: 'reward-response-redacted',
        expectedFile: 'reward-response.cmdhandler.expected.json',
        reason: undefined,
        schemaDiff: false,
        sourceDiff: false,
        missingPaths: 1,
        extraPaths: 0,
        ignoredExtraPaths: 2,
        valueDiffs: 0,
      },
    ]);
    expect(buildThresholdSummary(samples)).toEqual({
      pass: false,
      total: 0,
      failed: 0,
      missingBaselines: [],
      failures: [],
      required: {
        total: 0,
        failed: 0,
        failures: [],
      },
      cmdHandler: {
        total: 1,
        failed: 1,
        ignoredExtraPaths: 2,
        failures: listCmdHandlerFailures(samples),
      },
    });
  });

  it('cmdHandler ignored extra 上限失败时保留路径样例', () => {
    const samples = [{
      sample: 'reward-response-redacted',
      thresholds: {
        maxCmdHandlerIgnoredExtraPaths: {
          actual: 12,
          expected: 10,
          pass: false,
        },
      },
      cmdHandlerAlignment: {
        ignoredExtraPaths: 12,
        diff: {
          ignoredExtraPaths: Array.from({ length: 12 }, (_, index) => `$.extra.path${index + 1}`),
        },
      },
    }];
    const [failure] = listThresholdFailures(samples);

    expect(failure).toEqual({
      sample: 'reward-response-redacted',
      key: 'maxCmdHandlerIgnoredExtraPaths',
      actual: 12,
      expected: 10,
      ignoredExtraPathSamples: [
        '$.extra.path1',
        '$.extra.path2',
        '$.extra.path3',
        '$.extra.path4',
        '$.extra.path5',
        '$.extra.path6',
        '$.extra.path7',
        '$.extra.path8',
        '$.extra.path9',
        '$.extra.path10',
      ],
    });
    expect(formatThresholdFailure(failure)).toContain('ignoredExtraPathSamples=["$.extra.path1","$.extra.path2"');
    expect(formatThresholdFailure(failure)).toContain('...还有 2 个');
  });
});

describe('formatCorpusSnapshotMarkdownSummary', () => {
  it('生成适合 CI Step Summary 的 Markdown 表格', () => {
    const sample = buildCorpusSnapshotSample({
      fixture: {
        name: 'reward-response-redacted',
      },
      expectedSnapshot: createExpectedSnapshot(),
      responseText: '{"cmd":"1"}',
      report: createReport(),
      reportView: {
        isRecordTruncated: false,
        isCmdStructureTruncated: false,
        isPlaceholderTruncated: false,
        isUnresolvedTruncated: false,
        isWarningTruncated: false,
      },
      qualitySnapshot: createQualitySnapshot(),
      scanLocations: createScanLocations(),
    });
    const snapshot = {
      schemaVersion: 1,
      kind: SCHEME_CORPUS_SNAPSHOT_KIND,
      sampleCount: 1,
      thresholdSummary: buildThresholdSummary([sample]),
      samples: [sample],
    };

    expect(formatCorpusSnapshotMarkdownSummary(snapshot)).toContain('# Scheme Corpus 质量快照');
    expect(formatCorpusSnapshotMarkdownSummary(snapshot)).toContain('| reward-response-redacted | 临时输入 | 临时输入 | 100 | 2 | 2 | 5 | 1 | 2 | 0 | 0 | 0/9 | 0/3 |');
    expect(formatCorpusSnapshotMarkdownSummary(snapshot)).toContain('- 必需项失败: 0/3');
    expect(formatCorpusSnapshotMarkdownSummary(snapshot)).toContain('- cmdHandler 对齐失败: 0/0');
    expect(formatCorpusSnapshotMarkdownSummary(snapshot)).toContain('- cmdHandler 已忽略 extra: 0');
    expect(formatCorpusSnapshotMarkdownSummary(snapshot)).toContain('- 结果: PASS');
  });

  it('在 Markdown 摘要中展示缺失基线', () => {
    const snapshot = {
      schemaVersion: 1,
      kind: SCHEME_CORPUS_SNAPSHOT_KIND,
      sampleCount: 1,
      thresholdSummary: {
        pass: false,
        total: 0,
        failed: 0,
        missingBaselines: [
          {
            sample: 'new-response-redacted',
            expectedSnapshot: 'new-response.expected.snapshot.json',
          },
        ],
        failures: [],
        required: {
          total: 0,
          failed: 0,
          failures: [],
        },
        cmdHandler: {
          total: 0,
          failed: 0,
          ignoredExtraPaths: 0,
          failures: [],
        },
      },
      samples: [{
        sample: 'new-response-redacted',
        baseline: {
          expectedSnapshot: false,
          expectedSnapshotFile: 'new-response.expected.snapshot.json',
        },
        coverage: { score: 100 },
        totals: {
          records: 1,
          cmdStructures: 1,
          nestedCommandFields: 1,
          nestedResourceFields: 0,
          runtimePlaceholders: 0,
          unresolved: 0,
          warnings: 0,
        },
        thresholds: {},
      }],
    };

    const markdown = formatCorpusSnapshotMarkdownSummary(snapshot);
    expect(markdown).toContain('- 缺失基线: 1');
    expect(markdown).toContain('| new-response-redacted | 缺失 | 缺失 | 100 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0/0 | 0/0 |');
    expect(markdown).toContain('- new-response-redacted: 缺失 expected snapshot new-response.expected.snapshot.json');
  });

  it('在 Markdown 摘要中展示 cmdHandler 对齐失败', () => {
    const snapshot = {
      schemaVersion: 1,
      kind: SCHEME_CORPUS_SNAPSHOT_KIND,
      sampleCount: 1,
      thresholdSummary: {
        pass: false,
        total: 0,
        failed: 0,
        missingBaselines: [],
        failures: [],
        required: {
          total: 0,
          failed: 0,
          failures: [],
        },
        cmdHandler: {
          total: 1,
          failed: 1,
          ignoredExtraPaths: 2,
          failures: [{
            sample: 'reward-response-redacted',
            expectedFile: 'reward-response.cmdhandler.expected.json',
            schemaDiff: false,
            sourceDiff: false,
            missingPaths: 1,
            extraPaths: 0,
            ignoredExtraPaths: 2,
            valueDiffs: 0,
          }],
        },
      },
      samples: [{
        sample: 'reward-response-redacted',
        coverage: { score: 100 },
        totals: {
          records: 1,
          cmdStructures: 1,
          nestedCommandFields: 1,
          nestedResourceFields: 0,
          runtimePlaceholders: 0,
          unresolved: 0,
          warnings: 0,
        },
        thresholds: {},
        cmdHandlerAlignment: {
          pass: false,
          missingPaths: 1,
          ignoredExtraPaths: 2,
          valueDiffs: 0,
          schemaDiff: false,
        },
      }],
    };

    const markdown = formatCorpusSnapshotMarkdownSummary(snapshot);
    expect(markdown).toContain('- cmdHandler 对齐失败: 1/1');
    expect(markdown).toContain('- cmdHandler 已忽略 extra: 2');
    expect(markdown).toContain('| reward-response-redacted | 临时输入 | 失败(忽略 2) | 100 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0/0 | 0/0 |');
    expect(markdown).toContain('## cmdHandler 对齐失败');
    expect(markdown).toContain('- reward-response-redacted: missingPaths=1, valueDiffs=0, ignoredExtraPaths=2, schemaDiff=否');
  });

  it('在 Markdown 摘要中展示 cmdHandler ignored extra 路径样例', () => {
    const ignoredPaths = Array.from({ length: 12 }, (_, index) => `$.extra.path${index + 1}`);
    const snapshot = {
      schemaVersion: 1,
      kind: SCHEME_CORPUS_SNAPSHOT_KIND,
      sampleCount: 1,
      thresholdSummary: {
        pass: true,
        total: 0,
        failed: 0,
        missingBaselines: [],
        failures: [],
        required: {
          total: 0,
          failed: 0,
          failures: [],
        },
        cmdHandler: {
          total: 1,
          failed: 0,
          ignoredExtraPaths: 12,
          failures: [],
        },
      },
      samples: [{
        sample: 'reward-response-redacted',
        coverage: { score: 100 },
        totals: {
          records: 1,
          cmdStructures: 1,
          nestedCommandFields: 1,
          nestedResourceFields: 0,
          runtimePlaceholders: 0,
          unresolved: 0,
          warnings: 0,
        },
        thresholds: {},
        requiredChecks: {},
        cmdHandlerAlignment: {
          pass: true,
          ignoredExtraPaths: 12,
          diff: {
            ignoredExtraPaths: ignoredPaths,
          },
        },
      }],
    };

    const markdown = formatCorpusSnapshotMarkdownSummary(snapshot);
    expect(markdown).toContain('## cmdHandler 已忽略 extra 样例');
    expect(markdown).toContain('- reward-response-redacted: ignoredExtraPaths=12');
    expect(markdown).toContain('  - $.extra.path1');
    expect(markdown).toContain('  - $.extra.path10');
    expect(markdown).not.toContain('  - $.extra.path11');
    expect(markdown).toContain('  - ... 还有 2 个');
  });
});

describe('parseCliArgs', () => {
  it('支持通过本地 response 文件生成快照', () => {
    expect(parseCliArgs([
      '--input',
      '/tmp/response.json',
      '--name',
      'local-response',
    ])).toEqual({
      sampleFilter: undefined,
      inputPath: '/tmp/response.json',
      sampleName: 'local-response',
      outputPath: undefined,
      summaryPath: undefined,
      strict: false,
    });
  });

  it('支持严格检查模式', () => {
    expect(parseCliArgs([
      '--sample',
      'reward-response-redacted',
      '--strict',
    ])).toEqual({
      sampleFilter: 'reward-response-redacted',
      inputPath: undefined,
      sampleName: undefined,
      outputPath: undefined,
      summaryPath: undefined,
      strict: true,
    });
  });

  it('支持输出 JSON 快照和 Markdown 摘要路径', () => {
    expect(parseCliArgs([
      '--output',
      '../artifacts/snapshot.json',
      '--summary',
      '../artifacts/summary.md',
    ])).toEqual({
      sampleFilter: undefined,
      inputPath: undefined,
      sampleName: undefined,
      outputPath: '../artifacts/snapshot.json',
      summaryPath: '../artifacts/summary.md',
      strict: false,
    });
  });

  it('拒绝同时指定 corpus 样本和本地输入', () => {
    expect(() => parseCliArgs([
      '--sample',
      'reward-response-redacted',
      '--input',
      '/tmp/response.json',
    ])).toThrow('--input 不能和 corpus 样本名同时使用');
  });

  it('拒绝单独使用输入样本名', () => {
    expect(() => parseCliArgs(['--name', 'local-response']))
      .toThrow('--name 只能和 --input 一起使用');
  });
});
