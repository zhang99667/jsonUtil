import { describe, expect, it } from 'vitest';
import { formatTransformReportFooterSummary } from './transformReportFooterSummary';

describe('transformReportFooterSummary', () => {
  it('无报告时显示空态文案', () => {
    expect(formatTransformReportFooterSummary(null)).toBe('暂无解析上下文');
  });

  it('格式化报告底部汇总', () => {
    expect(formatTransformReportFooterSummary({
      filteredRecordCount: 2,
      totalRecordCount: 5,
      filteredCmdStructureCount: 1,
      totalCmdStructureCount: 3,
      filteredNestedCommandFieldCount: 4,
      totalNestedCommandFieldCount: 8,
      filteredNestedResourceFieldCount: 2,
      totalNestedResourceFieldCount: 6,
      filteredPlaceholderCount: 1,
      totalPlaceholderCount: 2,
      filteredUnresolvedCount: 0,
      totalUnresolvedCount: 1,
      filteredWarningCount: 3,
      totalWarningCount: 4,
    })).toBe('2/5 条展开记录 · 1/3 条CMD结构 · 4/8 个内部CMD字段 · 2/6 个资源字段 · 1/2 个占位符 · 0/1 条待检查 · 3/4 条跳过记录');
  });
});
