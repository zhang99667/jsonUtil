import { describe, expect, it } from 'vitest';
import type { SchemeCommandSummaryInfo } from './schemeMetadata';
import type {
  SchemeDecodeResult,
  SchemeDecodeWarning,
  SchemeParamDecodeStage,
  SchemePlaceholder,
} from './schemeUtils';
import {
  buildSchemeQualitySnapshot,
  buildSchemeQualitySummary,
  formatSchemeQualitySnapshotJsonText,
  formatSchemeQualitySummaryText,
} from './schemeQualitySummary';

const baseDecodeResult: SchemeDecodeResult = {
  original: '',
  decoded: '',
  layers: [],
  isJson: false,
};

const buildCommandSummary = (patch: Partial<SchemeCommandSummaryInfo> = {}): SchemeCommandSummaryInfo => ({
  commandFields: [],
  commandFieldRows: [],
  commandFieldCount: 0,
  resourceFields: [],
  resourceFieldRows: [],
  resourceFieldCount: 0,
  extFields: [],
  extFieldCount: 0,
  base64SuffixFields: [],
  base64SuffixFieldCount: 0,
  paramCount: 0,
  paramKeys: [],
  commandSchemaCount: 0,
  topCommandSchemas: [],
  ...patch,
});

const buildSummary = (patch: Partial<Parameters<typeof buildSchemeQualitySummary>[0]> = {}) => (
  buildSchemeQualitySummary({
    actualValue: 'sampleapp://v1/vendor/ad/demo',
    isDecodePending: false,
    isDecodeCancelled: false,
    editedJsonError: '',
    decodeResult: baseDecodeResult,
    commandSummaryInfo: null,
    placeholders: [],
    decodeWarnings: [],
    ...patch,
  })
);

describe('schemeQualitySummary', () => {
  it('空内容不展示质量摘要', () => {
    expect(buildSummary({ actualValue: '   ' })).toBeNull();
  });

  it('解析中优先展示后台状态', () => {
    expect(buildSummary({ isDecodePending: true })).toMatchObject({
      level: 'info',
      label: '解析中',
    });
  });

  it('JSON 编辑错误优先提示不可复制结构', () => {
    expect(buildSummary({ editedJsonError: 'JSON 内容格式有误' })).toMatchObject({
      level: 'error',
      label: 'JSON 异常',
    });
  });

  it('汇总 CMD、资源字段和占位符数量', () => {
    const placeholders: SchemePlaceholder[] = [{
      path: '$.ext.antiSpam',
      value: 'AFDXXX',
      description: '疑似运行时占位符',
    }];

    const summary = buildSummary({
      decodeResult: {
        ...baseDecodeResult,
        layers: [{
          type: 'url',
          before: 'input',
          description: 'URL Decode',
        }],
        isJson: true,
      },
      commandSummaryInfo: buildCommandSummary({
        commandSchemaCount: 2,
        commandFieldCount: 3,
        resourceFieldCount: 4,
      }),
      placeholders,
    });

    expect(summary).toMatchObject({
      level: 'info',
      label: '结构可用',
    });
    expect(summary?.items).toEqual(expect.arrayContaining([
      { label: '解码层', value: 1, tone: 'success' },
      { label: 'CMD', value: 2, tone: 'cyan' },
      { label: 'CMD字段', value: 3, tone: 'cyan' },
      { label: '资源字段', value: 4, tone: 'success' },
      { label: '占位符', value: 1, tone: 'warning' },
    ]));
  });

  it('性能护栏命中时汇总跳过数量', () => {
    const decodeWarnings: SchemeDecodeWarning[] = [{
      type: 'json_string_decode_skipped',
      message: '部分长字符串已跳过',
      skippedCount: 5,
      decodedStringCount: 10,
      totalStringLength: 1000,
      limit: 500,
      paths: ['$.payload'],
    }];

    const summary = buildSummary({ decodeWarnings });

    expect(summary).toMatchObject({
      level: 'warning',
      label: '部分跳过',
    });
    expect(summary?.items).toContainEqual({ label: '跳过', value: 5, tone: 'warning' });
  });

  it('格式化可协作复制的质量摘要文本', () => {
    const summary = buildSummary({
      commandSummaryInfo: buildCommandSummary({
        commandSchemaCount: 1,
        commandFieldCount: 2,
      }),
    });

    expect(summary && formatSchemeQualitySummaryText(summary)).toBe([
      'Scheme 解析质量摘要',
      '状态: 解析完成',
      '说明: 已识别 CMD、资源字段和可复制结构',
      '解码层: 0',
      'CMD: 1',
      'CMD字段: 2',
      '资源字段: 0',
      '占位符: 0',
      '跳过: 0',
    ].join('\n'));
  });

  it('汇总参数分层数量和脱敏修复提示', () => {
    const paramStages: SchemeParamDecodeStage[] = [
      {
        path: '$.params',
        key: 'params',
        source: 'query',
        raw: '%7b%22phone%22%3a%2213718164578%22%2ctype%22%3a%221%22%7d',
        urlDecoded: '{"phone":"13718164578",type":"1"}',
        parsed: '{"phone":"13718164578","type":"1"}',
        repairHint: 'Loose JSON 已补齐字段引号/单引号/尾逗号',
        reencoded: '%7B%22phone%22%3A%2213718164578%22%2C%22type%22%3A%221%22%7D',
        reversible: true,
      },
      {
        path: '$.logUrl',
        key: 'logUrl',
        source: 'log-field',
        raw: 'https://example.com/callback?token=SECRET_TOKEN_ABC',
        urlDecoded: 'https://example.com/callback?token=SECRET_TOKEN_ABC',
        parsed: 'https://example.com/callback?token=SECRET_TOKEN_ABC',
        reencoded: 'https%3A%2F%2Fexample.com%2Fcallback%3Ftoken%3DSECRET_TOKEN_ABC',
        reversible: false,
      },
    ];
    const decodeResult: SchemeDecodeResult = {
      ...baseDecodeResult,
      layers: [{
        type: 'url',
        before: 'input',
        description: 'URL Decode',
      }],
      isJson: true,
      paramStages,
    };
    const summary = buildSummary({ decodeResult });

    expect(summary?.items).toEqual(expect.arrayContaining([
      { label: '参数层', value: 2, tone: 'success' },
      { label: '修复提示', value: 1, tone: 'warning' },
    ]));

    const snapshotText = formatSchemeQualitySnapshotJsonText({
      summary: summary!,
      decodeResult,
      commandSummaryInfo: null,
      placeholders: [],
      decodeWarnings: [],
    });
    const snapshot = JSON.parse(snapshotText);

    expect(snapshot.totals).toMatchObject({
      paramStages: 2,
      paramStageRepairHints: 1,
      nonReversibleParamStages: 1,
    });
    expect(snapshot.hotspots.paramStageSources).toEqual([
      {
        source: 'log-field',
        count: 1,
        paths: ['$.logUrl'],
        hasMorePaths: false,
      },
      {
        source: 'query',
        count: 1,
        paths: ['$.params'],
        hasMorePaths: false,
      },
    ]);
    expect(snapshot.hotspots.paramStageKeys).toEqual([
      {
        key: 'logUrl',
        count: 1,
        paths: ['$.logUrl'],
        hasMorePaths: false,
      },
      {
        key: 'params',
        count: 1,
        paths: ['$.params'],
        hasMorePaths: false,
      },
    ]);
    expect(snapshot.hotspots.paramStageRepairHints).toEqual([{
      hint: 'Loose JSON 已补齐字段引号/单引号/尾逗号',
      count: 1,
      paths: ['$.params'],
      hasMorePaths: false,
    }]);
    expect(snapshot.hotspots.paramStageSamples).toEqual([
      {
        path: '$.params',
        key: 'params',
        source: 'query',
        lengths: {
          encodedInput: paramStages[0].raw.length,
          decodedInput: paramStages[0].urlDecoded.length,
          expandedOutput: paramStages[0].parsed.length,
          encodedOutput: paramStages[0].reencoded.length,
        },
        reversible: true,
        hasRepairHint: true,
        repairHint: 'Loose JSON 已补齐字段引号/单引号/尾逗号',
      },
      {
        path: '$.logUrl',
        key: 'logUrl',
        source: 'log-field',
        lengths: {
          encodedInput: paramStages[1].raw.length,
          decodedInput: paramStages[1].urlDecoded.length,
          expandedOutput: paramStages[1].parsed.length,
          encodedOutput: paramStages[1].reencoded.length,
        },
        reversible: false,
        hasRepairHint: false,
      },
    ]);
    expect(snapshot.recommendations).toContain('参数分层存在修复提示，建议核对原始值、URL Decode、JSON 解析链路后再沉淀样本');
    expect(snapshotText).not.toContain('13718164578');
    expect(snapshotText).not.toContain('SECRET_TOKEN_ABC');
    expect(snapshotText).not.toContain('%7b%22phone%22');
    expect(snapshotText).not.toContain('example.com/callback');
    expect(snapshotText).not.toContain('"raw"');
    expect(snapshotText).not.toContain('"urlDecoded"');
    expect(snapshotText).not.toContain('"parsed"');
    expect(snapshotText).not.toContain('"reencoded"');
  });

  it('构建不含原始业务值的结构化质量快照', () => {
    const placeholders: SchemePlaceholder[] = [{
      path: '$.cmd.phone',
      value: '__VIRTUALPHONE__',
      description: '运行时虚拟号码占位符',
    }];
    const decodeWarnings: SchemeDecodeWarning[] = [{
      type: 'json_string_decode_skipped',
      message: '部分长字符串已跳过',
      skippedCount: 2,
      decodedStringCount: 3,
      totalStringLength: 1200,
      limit: 500,
      paths: ['$.cmd.logUrl'],
    }];
    const decodeResult: SchemeDecodeResult = {
      ...baseDecodeResult,
      original: 'cmd=%7B%22phone%22%3A%2213718164578%22%7D',
      decoded: '{"cmd":{"phone":"13718164578"}}',
      layers: [{
        type: 'url',
        before: 'cmd=%7B%22phone%22%3A%2213718164578%22%7D',
        description: 'URL Decode',
      }],
      isJson: true,
    };
    const commandSummaryInfo = buildCommandSummary({
      commandSchemaCount: 1,
      commandFieldCount: 2,
      resourceFieldCount: 1,
      extFieldCount: 1,
      base64SuffixFieldCount: 1,
      commandFields: ['cmd', 'button_cmd'],
      resourceFields: ['logUrl'],
      extFields: ['ext'],
      base64SuffixFields: ['extInfo'],
      topCommandSchemas: [{
        schema: 'sampleapp://v7/vendor/ad/makePhoneCall',
        count: 1,
        paths: ['$.cmd'],
        hasMorePaths: false,
      }],
    });
    const summary = buildSummary({
      decodeResult,
      commandSummaryInfo,
      placeholders,
      decodeWarnings,
    });

    expect(summary).not.toBeNull();
    const snapshot = buildSchemeQualitySnapshot({
      summary: summary!,
      decodeResult,
      commandSummaryInfo,
      placeholders,
      decodeWarnings,
    });

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      kind: 'json-helper-scheme-quality-snapshot',
      safety: {
        containsRawValue: false,
      },
      status: {
        label: '部分跳过',
      },
      coverage: {
        score: 75,
        level: 'warning',
      },
      totals: {
        records: 1,
        cmdStructures: 1,
        nestedCommandFields: 2,
        nestedResourceFields: 1,
        unresolved: 0,
        decodeLayers: 1,
        commandSchemas: 1,
        commandFields: 2,
        resourceFields: 1,
        extFields: 1,
        base64SuffixFields: 1,
        runtimePlaceholders: 1,
        warnings: 1,
        skipped: 2,
      },
    });
    expect(snapshot.hotspots.topCommandSchemas).toEqual([{
      schema: 'sampleapp://v7/vendor/ad/makePhoneCall',
      count: 1,
      paths: ['$.cmd'],
      hasMorePaths: false,
    }]);
    expect(snapshot.hotspots.runtimePlaceholders).toEqual([{
      value: '__VIRTUALPHONE__',
      count: 1,
      description: '运行时虚拟号码占位符',
      paths: ['$.cmd.phone'],
    }]);

    const snapshotText = formatSchemeQualitySnapshotJsonText({
      summary: summary!,
      decodeResult,
      commandSummaryInfo,
      placeholders,
      decodeWarnings,
    });
    expect(snapshotText).toContain('"containsRawValue": false');
    expect(snapshotText).not.toContain('13718164578');
    expect(snapshotText).not.toContain('cmd=%7B');
  });
});
