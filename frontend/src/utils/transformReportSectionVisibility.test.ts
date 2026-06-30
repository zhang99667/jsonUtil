import { describe, expect, it } from 'vitest';
import { buildTransformReportSectionVisibility } from './transformReportSectionVisibility';

describe('transformReportSectionVisibility', () => {
  it('无报告视图时隐藏所有区域和空态', () => {
    expect(buildTransformReportSectionVisibility(null)).toEqual({
      showRecords: false,
      showUnresolved: false,
      showPlaceholders: false,
      showWarnings: false,
      showEmptyState: false,
    });
  });

  it('所有筛选计数为 0 时只展示筛选空态', () => {
    expect(buildTransformReportSectionVisibility({
      filteredRecordCount: 0,
      filteredUnresolvedCount: 0,
      filteredPlaceholderCount: 0,
      filteredWarningCount: 0,
    })).toEqual({
      showRecords: false,
      showUnresolved: false,
      showPlaceholders: false,
      showWarnings: false,
      showEmptyState: true,
    });
  });

  it('按四类筛选计数独立控制区域展示', () => {
    expect(buildTransformReportSectionVisibility({
      filteredRecordCount: 2,
      filteredUnresolvedCount: 0,
      filteredPlaceholderCount: 1,
      filteredWarningCount: 3,
    })).toEqual({
      showRecords: true,
      showUnresolved: false,
      showPlaceholders: true,
      showWarnings: true,
      showEmptyState: false,
    });
  });
});
