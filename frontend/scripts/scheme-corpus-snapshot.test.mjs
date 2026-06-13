import { describe, expect, it } from 'vitest';
import {
  applyCorpusReplacements,
  buildCorpusResponseText,
  buildCorpusSnapshotSample,
  buildThresholdResults,
  buildThresholdSummary,
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

const createExpectedSnapshot = () => ({
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
});

describe('buildCorpusSnapshotSample', () => {
  it('汇总单个 corpus 的质量快照和阈值结果', () => {
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
    });

    expect(SCHEME_CORPUS_SNAPSHOT_KIND).toBe('json-helper-scheme-corpus-quality-snapshot');
    expect(sample).toMatchObject({
      sample: 'reward-response-redacted',
      responseBytes: 11,
      totals: {
        nestedResourceFields: 1,
      },
      runtimePlaceholders: [
        {
          value: '__CONVERT_CMD__',
          count: 2,
          sourceCount: 1,
        },
      ],
      thresholds: {
        leadHotspotResourceSchema: {
          pass: true,
        },
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
      failures: [
        {
          sample: 'fail-sample',
          key: 'minNestedCommandFields',
          actual: 3,
          expected: 4,
        },
      ],
    });
  });

  it('没有阈值时视为通过', () => {
    expect(buildThresholdSummary([{ sample: 'input-response', thresholds: {} }]))
      .toEqual({
        pass: true,
        total: 0,
        failed: 0,
        failures: [],
      });
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
      strict: true,
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
