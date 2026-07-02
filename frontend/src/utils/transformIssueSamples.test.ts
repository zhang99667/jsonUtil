import { describe, expect, it } from 'vitest';
import { buildTransformIssueSampleExport, formatTransformIssueSampleJsonText } from './transformIssueSamples';
import type { TransformReportView } from './transformSummary';

describe('transformIssueSamples', () => {
  it('入口组装样本导出结构和摘要计数', () => {
    const reportView = {
      unresolvedCandidates: [{
        path: '$.url',
        originalValue: 'https://example.com',
        message: '未解析',
        length: 19,
        preview: 'https://example.com',
        reasonLabel: '疑似 URL',
        reasonLevel: 'warning',
        nextAction: '检查编码',
      }],
      runtimePlaceholders: [],
      warnings: [],
      filteredUnresolvedCount: 1,
      totalUnresolvedCount: 2,
      isUnresolvedTruncated: true,
      filteredPlaceholderCount: 0,
      totalPlaceholderCount: 0,
      isPlaceholderTruncated: false,
      filteredWarningCount: 0,
      totalWarningCount: 0,
      isWarningTruncated: false,
    } as TransformReportView;

    const sampleExport = buildTransformIssueSampleExport(reportView, { filter: ' url ' });

    expect(sampleExport).toMatchObject({
      schemaVersion: 1,
      kind: 'json-helper-transform-issue-samples',
      filter: 'url',
      summary: {
        unresolved: { copied: 1, filtered: 1, total: 2, truncated: true },
        runtimePlaceholders: { copied: 0 },
        warnings: { copied: 0 },
      },
      samples: [{ type: 'unresolved', path: '$.url', reasonLabel: '疑似 URL' }],
    });
  });

  it('没有样本时返回空文本', () => {
    const reportView = {
      unresolvedCandidates: [],
      runtimePlaceholders: [],
      warnings: [],
    } as unknown as TransformReportView;

    expect(formatTransformIssueSampleJsonText(reportView)).toBe('');
  });
});
