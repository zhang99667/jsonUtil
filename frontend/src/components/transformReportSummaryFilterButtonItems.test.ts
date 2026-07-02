import { describe, expect, it } from 'vitest';
import type { TransformContextReport } from '../utils/transformSummary';
import { getTransformReportSummaryFilterButtonItems } from './transformReportSummaryFilterButtonItems';

const buildReport = (overrides: Partial<TransformContextReport> = {}): TransformContextReport => ({
  summary: {
    recordCount: 8,
    unresolvedCount: 6,
    warningCount: 7,
    placeholderCount: 8,
    schemeCounts: {
      queryString: 1,
      url: 1,
      base64: 1,
      nonReversible: 5,
    },
  },
  cmdStructureCount: 1,
  nestedCommandFieldCount: 2,
  nestedResourceFieldCount: 3,
  ...overrides,
} as TransformContextReport);

describe('getTransformReportSummaryFilterButtonItems', () => {
  it('按固定顺序生成非零筛选按钮配置', () => {
    expect(getTransformReportSummaryFilterButtonItems(buildReport(), 4)).toMatchObject([
      { label: 'CMD结构', count: 1, query: 'CMD结构', dataTour: 'transform-report-cmd-structure-count' },
      { label: '内部CMD', count: 2, query: '内部CMD字段', dataTour: 'transform-report-nested-cmd-count' },
      { label: '资源URL', count: 3, query: '资源URL', dataTour: 'transform-report-nested-resource-count' },
      { label: '待处理', count: 4, query: '待处理', dataTour: 'transform-report-issue-priority' },
      { label: '不可逆', count: 5, query: '不可逆', dataTour: 'transform-report-non-reversible-count' },
      { label: '待检查', count: 6, query: '待检查', dataTour: 'transform-report-unresolved-count' },
      { label: '跳过', count: 7, query: '跳过', dataTour: 'transform-report-warning-count' },
      { label: '占位符', count: 8, query: '占位符', dataTour: 'transform-report-placeholder-count' },
    ]);
  });

  it('过滤零计数按钮并把缺失资源计数视为 0', () => {
    const items = getTransformReportSummaryFilterButtonItems(buildReport({
      summary: {
        ...buildReport().summary,
        unresolvedCount: 0,
        warningCount: 0,
        placeholderCount: 1,
        schemeCounts: {
          ...buildReport().summary.schemeCounts,
          nonReversible: 0,
        },
      },
      cmdStructureCount: 0,
      nestedCommandFieldCount: 0,
      nestedResourceFieldCount: undefined,
    }), 0);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      label: '占位符',
      count: 1,
      dataTour: 'transform-report-placeholder-count',
    });
  });
});
