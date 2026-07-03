import { describe, expect, it } from 'vitest';
import type { TransformContextReport, TransformReportView } from './transformSummary';
import { buildTransformReportPanelActionState } from './transformReportPanelActionState';

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

const buildState = (
  overrides: Partial<Parameters<typeof buildTransformReportPanelActionState>[0]> = {}
) => buildTransformReportPanelActionState({
  report: createReport(),
  reportView: createView(),
  isFilterPending: false,
  canOpenPlaceholderFill: true,
  placeholderFillTitle: '打开占位符回填',
  archivePackageTitle: '复制归档包',
  collaborationReportTitle: '复制协作报告',
  qualitySnapshotTitle: '复制质量快照',
  ...overrides,
});

describe('buildTransformReportPanelActionState', () => {
  it('从报告摘要派生问题优先级和 triage 状态', () => {
    const state = buildState();

    expect(state.issuePriorityCount).toBe(4);
    expect(state.issueTriageState).toMatchObject({
      warningCount: 1,
      unresolvedCount: 1,
      placeholderCount: 2,
      canOpenPlaceholderFill: true,
    });
    expect(state.nextActionState).toMatchObject({
      hasReport: true,
      hasReportView: true,
      hasFilteredCmdStructure: true,
      hasPlaceholders: true,
    });
  });

  it('无报告但有 reportView 时保留复制类行动条件', () => {
    const state = buildState({ report: null, reportView: createView() });

    expect(state.issuePriorityCount).toBe(0);
    expect(state.issueTriageState).toBeNull();
    expect(state.nextActionState).toMatchObject({
      hasReport: false,
      hasReportView: true,
      hasFilteredCmdStructure: true,
      hasPlaceholders: false,
    });
  });
});
