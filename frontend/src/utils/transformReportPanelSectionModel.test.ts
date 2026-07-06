import { describe, expect, it } from 'vitest';
import type { TransformContextReport, TransformReportView } from './transformSummary';
import { buildTransformReportPanelSectionModel } from './transformReportPanelSectionModel';

const createReport = (): TransformContextReport => ({
  summary: {
    totalCount: 3,
    decodedCount: 3,
    decodedLayerCount: 0,
    commandParamCount: 0,
    cmdStructureCount: 1,
    nestedCommandFieldCount: 0,
    placeholderCount: 2,
    unresolvedCount: 1,
    warningCount: 1,
  },
} as unknown as TransformContextReport);

const createView = (): TransformReportView => ({
  filteredRecordCount: 1,
  filteredWarningCount: 1,
  filteredUnresolvedCount: 1,
  filteredPlaceholderCount: 2,
  filteredCmdStructureCount: 1,
  isPlaceholderTruncated: true,
} as unknown as TransformReportView);

describe('buildTransformReportPanelSectionModel', () => {
  it('组合占位符工具栏、优先处理和下一步行动状态', () => {
    const model = buildTransformReportPanelSectionModel({
      report: createReport(),
      reportView: createView(),
      isFilterPending: false,
      hasTemplateFillTarget: true,
      hasPlaceholderFillTemplate: true,
      placeholderFillTemplateSummary: null,
      archivePackageTitle: '复制归档包',
      collaborationReportTitle: '复制协作报告',
      qualitySnapshotTitle: '复制质量快照',
    });

    expect(model).toMatchObject({
      placeholderFillPanelTitle: '把运行时占位符回填模板填入模板填充面板',
      canOpenPlaceholderFill: true,
      issuePriorityCount: 4,
      placeholderToolbarState: {
        filteredPlaceholderCount: 2,
        isPlaceholderTruncated: true,
        canShowOpenTemplateFill: true,
        isPlaceholderFillTemplateDisabled: false,
      },
      sectionVisibility: {
        showRecords: true,
        showUnresolved: true,
        showPlaceholders: true,
        showWarnings: true,
        showEmptyState: false,
      },
    });
    expect(model.issueTriageItems.map(item => item.action)).toEqual([
      'filter-warning',
      'filter-unresolved',
      'open-placeholder-fill',
    ]);
    expect(model.nextActions.map(item => item.action)).toEqual([
      'compare-cmd',
      'open-placeholder-fill',
      'copy-archive',
    ]);
  });

  it('无报告时返回空 section model', () => {
    const model = buildTransformReportPanelSectionModel({
      report: null,
      reportView: null,
      isFilterPending: true,
      hasTemplateFillTarget: true,
      hasPlaceholderFillTemplate: false,
      placeholderFillTemplateSummary: null,
      archivePackageTitle: '复制归档包',
      collaborationReportTitle: '复制协作报告',
      qualitySnapshotTitle: '复制质量快照',
    });

    expect(model).toMatchObject({
      canOpenPlaceholderFill: false,
      placeholderToolbarState: null,
      issuePriorityCount: 0,
      issueTriageItems: [],
      nextActions: [],
      sectionVisibility: {
        showRecords: false,
        showUnresolved: false,
        showPlaceholders: false,
        showWarnings: false,
        showEmptyState: false,
      },
    });
  });
});
