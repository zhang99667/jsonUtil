import { describe, expect, it } from 'vitest';
import type { TransformReportRecord } from './transformSummary';
import { appendReportRecordLines } from './transformReportRecordTextLines';

const appendLines = (records: TransformReportRecord[], commandSchemaRowLimit = 1): string[] => {
  const lines: string[] = [];
  appendReportRecordLines(lines, records, {
    commandSchemaRowLimit,
    formatDecodedPathCount: record => (
      record.isDecodedPathCountTruncated ? `${record.decodedPathCount}+` : String(record.decodedPathCount)
    ),
  });
  return lines;
};

describe('transformReportRecordTextLines', () => {
  it('空记录输出占位行', () => {
    expect(appendLines([])).toEqual(['- 无']);
  });

  it('输出记录明细并保留截断提示', () => {
    const lines = appendLines([
      {
        path: '$.cmd',
        labels: ['Scheme', 'CMD'],
        decodedPreview: 'baiduboxapp://v1/demo',
        insights: ['命中内部 CMD', '存在资源 URL'],
        commandParamCount: 3,
        commandParamKeys: ['url'],
        schemeParamStageSummary: {
          total: 3,
          keys: [{ key: 'url', count: 1 }],
          stages: [],
          repairHints: 2,
          nonReversible: 1,
        },
        commandSchemaRows: [
          { path: '$.cmd.schema', schema: 'baiduboxapp://v1/demo', source: 'cmd=1' },
          { path: '$.cmd.panel', schema: 'baiduboxapp://v1/panel', source: 'cmd=2' },
        ],
        nestedCommandFields: [{ path: '$.cmd.panel', preview: 'baiduboxapp://panel' }],
        hasMoreNestedCommandFields: true,
        nestedCommandFieldCount: 4,
        indexedNestedCommandFieldCount: 2,
        nestedResourceFields: [{ path: '$.cmd.icon', preview: 'https://cdn.example.com/a.png' }],
        hasMoreNestedResourceFields: true,
        nestedResourceFieldCount: 5,
        indexedNestedResourceFieldCount: 2,
        decodedPaths: [{ path: '$.cmd.params', preview: '对象: params' }],
        hasMoreDecodedPaths: true,
        decodedPathCount: 8,
        isDecodedPathCountTruncated: true,
      },
    ] as unknown as TransformReportRecord[]);

    expect(lines).toContain('- $.cmd: Scheme -> CMD');
    expect(lines).toContain('  解析结果: baiduboxapp://v1/demo');
    expect(lines).toContain('  解析线索: 命中内部 CMD；存在资源 URL');
    expect(lines).toContain('  cmdParams: 3 个顶层参数（url ... +2）');
    expect(lines).toContain('  参数分层: 3 个（url ... +2）');
    expect(lines).toContain('  参数修复提示: 2');
    expect(lines).toContain('  参数不可回写: 1');
    expect(lines).toContain('  CMD Schema路径: $.cmd.schema=baiduboxapp://v1/demo');
    expect(lines).toContain('  CMD Schema路径: 还有更多未展示（总计 2 条）');
    expect(lines).toContain('  内部CMD字段: $.cmd.panel=baiduboxapp://panel');
    expect(lines).toContain('  内部CMD字段: 还有更多未展示（总计 4 个，已索引 2 个）');
    expect(lines).toContain('  资源URL字段: $.cmd.icon=https://cdn.example.com/a.png');
    expect(lines).toContain('  资源URL字段: 还有更多未展示（总计 5 个，已索引 2 个）');
    expect(lines).toContain('  内部路径: $.cmd.params=对象: params');
    expect(lines).toContain('  内部路径: 还有更多未展示（总计 8+ 条）');
  });
});
