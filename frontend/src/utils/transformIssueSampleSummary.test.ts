import { describe, expect, it } from 'vitest';
import { buildTransformIssueSampleSummary } from './transformIssueSampleSummary';
import { createIssueSampleReportView } from './transformIssueSampleCollectorsTestFixture';

describe('transformIssueSampleSummary', () => {
  it('根据视图计数构建样本导出摘要', () => {
    const summary = buildTransformIssueSampleSummary(createIssueSampleReportView({
      unresolvedCandidates: [{
        path: '$.x',
        originalValue: '1',
        message: 'x',
        length: 1,
        preview: '1',
        reasonLabel: '未解析',
        reasonLevel: 'info',
        nextAction: '检查',
      }],
      warnings: [{
        type: 'string_decode_skipped',
        path: '$.w',
        originalValue: 'w',
        message: '跳过',
        length: 1,
        limit: 10,
        reasonLabel: '跳过',
        nextAction: '忽略',
      }],
      filteredUnresolvedCount: 2,
      totalUnresolvedCount: 5,
      isUnresolvedTruncated: true,
      filteredPlaceholderCount: 3,
      totalPlaceholderCount: 7,
      isPlaceholderTruncated: true,
      filteredWarningCount: 4,
      totalWarningCount: 9,
      isWarningTruncated: true,
    }), 6);

    expect(summary).toEqual({
      unresolved: { copied: 1, filtered: 2, total: 5, truncated: true },
      runtimePlaceholders: { copied: 6, filtered: 3, total: 7, truncated: true },
      warnings: { copied: 1, filtered: 4, total: 9, truncated: true },
    });
  });
});
