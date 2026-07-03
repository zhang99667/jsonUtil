import { describe, expect, it } from 'vitest';
import type { TransformContextReport, TransformReportView } from './transformSummary';
import { buildTransformReportPanelActionModel } from './transformReportPanelActionModel';

const createReport = (): TransformContextReport => ({
  summary: {
    placeholderCount: 2,
    unresolvedCount: 1,
    warningCount: 1,
  },
} as unknown as TransformContextReport);

const createView = (): TransformReportView => ({
  filteredCmdStructureCount: 1,
} as unknown as TransformReportView);

describe('buildTransformReportPanelActionModel', () => {
  it('组合问题 triage 和下一步行动', () => {
    const model = buildTransformReportPanelActionModel({
      report: createReport(),
      reportView: createView(),
      isFilterPending: false,
      canOpenPlaceholderFill: true,
      placeholderFillTitle: '打开占位符回填',
      archivePackageTitle: '复制归档包',
      collaborationReportTitle: '复制协作报告',
      qualitySnapshotTitle: '复制质量快照',
    });

    expect(model.issuePriorityCount).toBe(4);
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

  it('无报告时返回空行动模型', () => {
    const model = buildTransformReportPanelActionModel({
      report: null,
      reportView: null,
      isFilterPending: true,
      canOpenPlaceholderFill: false,
      placeholderFillTitle: '打开占位符回填',
      archivePackageTitle: '复制归档包',
      collaborationReportTitle: '复制协作报告',
      qualitySnapshotTitle: '复制质量快照',
    });

    expect(model).toMatchObject({
      issuePriorityCount: 0,
      issueTriageItems: [],
      nextActions: [],
    });
  });
});
