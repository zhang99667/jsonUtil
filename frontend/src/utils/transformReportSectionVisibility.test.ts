import { describe, expect, it } from 'vitest';
import { buildTransformReportSectionVisibility } from './transformReportSectionVisibility';
import {
  buildTransformReportVisibleSectionFlags,
  hasVisibleTransformReportSection,
} from './transformReportVisibleSections';

describe('transformReportSectionVisibility', () => {
  it('无报告视图时隐藏所有区域和空态', () => {
    expect(buildTransformReportSectionVisibility(null)).toEqual({
      showRecords: false,
      showUnresolved: false,
      showPlaceholders: false,
      showWarnings: false,
      showEmptyState: false,
    });

    expect(buildTransformReportSectionVisibility(undefined)).toEqual({
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

  it.each([
    ['展开记录', 'filteredRecordCount', 'showRecords'],
    ['待检查', 'filteredUnresolvedCount', 'showUnresolved'],
    ['占位符', 'filteredPlaceholderCount', 'showPlaceholders'],
    ['跳过记录', 'filteredWarningCount', 'showWarnings'],
  ] as const)('仅 %s 计数大于 0 时只展示对应 section', (_label, countKey, flagKey) => {
    const visibility = buildTransformReportSectionVisibility({
      filteredRecordCount: 0,
      filteredUnresolvedCount: 0,
      filteredPlaceholderCount: 0,
      filteredWarningCount: 0,
      [countKey]: 1,
    });

    expect(visibility).toEqual({
      showRecords: flagKey === 'showRecords',
      showUnresolved: flagKey === 'showUnresolved',
      showPlaceholders: flagKey === 'showPlaceholders',
      showWarnings: flagKey === 'showWarnings',
      showEmptyState: false,
    });
  });

  it('可见区域 helper 只派生四类 section flag', () => {
    expect(buildTransformReportVisibleSectionFlags({
      filteredRecordCount: 1,
      filteredUnresolvedCount: 2,
      filteredPlaceholderCount: 0,
      filteredWarningCount: 4,
    })).toEqual({
      showRecords: true,
      showUnresolved: true,
      showPlaceholders: false,
      showWarnings: true,
    });
  });

  it('任一区域可见时不展示筛选空态', () => {
    expect(hasVisibleTransformReportSection({
      showRecords: false,
      showUnresolved: false,
      showPlaceholders: false,
      showWarnings: false,
    })).toBe(false);

    expect(hasVisibleTransformReportSection({
      showRecords: false,
      showUnresolved: true,
      showPlaceholders: false,
      showWarnings: false,
    })).toBe(true);
  });
});
