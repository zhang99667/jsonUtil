import { describe, expect, it } from 'vitest';
import type { SchemeCommandSummaryInfo } from './schemeMetadata';
import type { SchemeDecodeResult, SchemeDecodeWarning, SchemePlaceholder } from './schemeUtils';
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
    actualValue: 'baiduboxapp://v1/vendor/ad/demo',
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
        schema: 'baiduboxapp://v7/vendor/ad/makePhoneCall',
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
      schema: 'baiduboxapp://v7/vendor/ad/makePhoneCall',
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
