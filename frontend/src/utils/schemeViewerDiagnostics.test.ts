import { describe, expect, it } from 'vitest';
import type {
  Base64MetaInfo,
  SchemeCommandSummaryInfo,
} from './schemeMetadata';
import type {
  SchemeDecodeResult,
  SchemeDecodeWarning,
  SchemeParamDecodeStage,
  SchemePlaceholder,
} from './schemeUtils';
import {
  buildSchemeDiagnosticSummaryItems,
  buildSchemeViewerParamSections,
  getSchemeViewerParamCount,
  getSchemeViewerParamEntries,
  hasSchemeDiagnosticDetails,
  sumSchemeSkippedDecodeCount,
} from './schemeViewerDiagnostics';

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

const buildParamStage = (patch: Partial<SchemeParamDecodeStage> = {}): SchemeParamDecodeStage => ({
  path: '$.params.url',
  key: 'url',
  source: 'query',
  raw: '%7B%22a%22%3A1%7D',
  urlDecoded: '{"a":1}',
  parsed: '{\n  "a": 1\n}',
  reencoded: '%7B%22a%22%3A1%7D',
  reversible: true,
  ...patch,
});

const buildDecodeWarning = (skippedCount: number): SchemeDecodeWarning => ({
  type: 'json_string_decode_skipped',
  message: '部分长字符串已跳过',
  skippedCount,
  decodedStringCount: 1,
  totalStringLength: 1000,
  limit: 500,
  paths: ['$.payload'],
});

const base64MetaInfo: Base64MetaInfo = {
  prefix: 'AFD',
  suffix: 'YWJj',
  suffixDecodePrefix: '',
  suffixLength: 4,
  suffixDecodedCount: 1,
  suffixDecodedEntries: [{ key: 'token', displayValue: 'abc' }],
};

describe('schemeViewerDiagnostics', () => {
  it('统计 query/hash 参数并过滤空参数来源', () => {
    const sections = buildSchemeViewerParamSections({
      protocol: 'baiduboxapp:',
      host: 'v7',
      path: '/vendor/ad/prerender',
      params: {
        url: 'https://example.com',
        duplicate: ['a', 'b'],
      },
      hashParams: undefined,
    });

    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Query 参数');
    expect(getSchemeViewerParamCount(sections[0].params)).toBe(3);
    expect(getSchemeViewerParamEntries(sections[0].params)).toEqual([
      ['url', 'https://example.com'],
      ['duplicate', ['a', 'b']],
    ]);
  });

  it('生成 Scheme 弹窗诊断摘要徽标', () => {
    const decodeResult: SchemeDecodeResult = {
      ...baseDecodeResult,
      schemeInfo: {
        protocol: 'baiduboxapp:',
        host: 'v7',
        path: '/vendor/ad/prerender',
        params: { params: '{"url":"https://example.com"}' },
        hashParams: { tab: ['feed', 'search'] },
      },
      layers: [{
        type: 'url',
        before: 'input',
        description: 'URL Decode',
      }],
    };
    const paramSections = buildSchemeViewerParamSections(decodeResult.schemeInfo);
    const placeholders: SchemePlaceholder[] = [{
      path: '$.extInfo',
      value: 'AFDXXX',
      description: '疑似运行时占位符',
    }];
    const skippedDecodeCount = sumSchemeSkippedDecodeCount([
      buildDecodeWarning(2),
      buildDecodeWarning(3),
    ]);

    expect(buildSchemeDiagnosticSummaryItems({
      decodeResult,
      commandSummaryInfo: buildCommandSummary({ commandSchemaCount: 1 }),
      paramSections,
      paramStages: [buildParamStage()],
      placeholders,
      skippedDecodeCount,
      base64MetaInfo,
    }).map(item => item.label)).toEqual([
      'baiduboxapp: · v7 · /vendor/ad/prerender',
      'CMD · 1',
      '参数 · 3',
      '参数层 · 1',
      '解码层 · 1',
      '占位符 · 1',
      '跳过 · 5',
      'Base64 线索',
    ]);
  });

  it('无诊断内容时不展示详情面板', () => {
    expect(hasSchemeDiagnosticDetails({
      schemeQualitySummary: null,
      decodeResult: baseDecodeResult,
      commandSummaryInfo: null,
      paramSections: [],
      paramStages: [],
      placeholders: [],
      decodeWarnings: [],
      base64MetaInfo: null,
    })).toBe(false);
  });

  it('任一诊断来源存在时展示详情面板', () => {
    expect(hasSchemeDiagnosticDetails({
      schemeQualitySummary: null,
      decodeResult: baseDecodeResult,
      commandSummaryInfo: null,
      paramSections: [],
      paramStages: [],
      placeholders: [],
      decodeWarnings: [buildDecodeWarning(1)],
      base64MetaInfo: null,
    })).toBe(true);
  });
});
