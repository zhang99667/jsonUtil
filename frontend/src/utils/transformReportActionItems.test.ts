import { describe, expect, it } from 'vitest';
import {
  buildTransformReportIssueTriageItems,
  buildTransformReportNextActionItems,
  type TransformReportNextActionState,
} from './transformReportActionItems';

const buildNextActionState = (
  overrides: Partial<TransformReportNextActionState> = {}
): TransformReportNextActionState => ({
  hasReport: true,
  hasReportView: true,
  hasFilteredCmdStructure: true,
  hasPlaceholders: true,
  issuePriorityCount: 3,
  canOpenPlaceholderFill: true,
  isFilterPending: false,
  placeholderFillTitle: '打开占位符回填',
  archivePackageTitle: '复制归档包',
  collaborationReportTitle: '复制协作报告',
  qualitySnapshotTitle: '复制质量快照',
  ...overrides,
});

describe('transformReportActionItems', () => {
  it('按跳过、待检查、占位符顺序生成优先处理项', () => {
    expect(buildTransformReportIssueTriageItems({
      warningCount: 2,
      unresolvedCount: 1,
      placeholderCount: 3,
      canOpenPlaceholderFill: true,
      placeholderFillTitle: '打开占位符回填',
    })).toMatchObject([
      { key: 'warning', count: 2, action: 'filter-warning' },
      { key: 'unresolved', count: 1, action: 'filter-unresolved' },
      {
        key: 'placeholder',
        count: 3,
        actionLabel: '回填占位符',
        title: '打开占位符回填',
        action: 'open-placeholder-fill',
      },
    ]);
  });

  it('占位符无法回填时退化为查看占位符', () => {
    expect(buildTransformReportIssueTriageItems({
      warningCount: 0,
      unresolvedCount: 0,
      placeholderCount: 1,
      canOpenPlaceholderFill: false,
      placeholderFillTitle: '当前筛选没有可用模板',
    })).toEqual([
      expect.objectContaining({
        key: 'placeholder',
        actionLabel: '查看占位符',
        action: 'filter-placeholder',
      }),
    ]);
  });

  it('推荐下一步优先保留 CMD 对比、占位符和归档包', () => {
    expect(buildTransformReportNextActionItems(buildNextActionState())).toMatchObject([
      { key: 'compare-cmd', action: 'compare-cmd', tone: 'primary' },
      { key: 'placeholder', action: 'open-placeholder-fill', tone: 'purple' },
      { key: 'archive', action: 'copy-archive', tone: 'cyan' },
    ]);
  });

  it('没有占位符时用待处理聚合动作补位', () => {
    expect(buildTransformReportNextActionItems(buildNextActionState({
      hasFilteredCmdStructure: false,
      hasPlaceholders: false,
      issuePriorityCount: 2,
    })).map(item => item.action)).toEqual([
      'filter-triage',
      'copy-archive',
      'copy-collaboration',
    ]);
  });

  it('筛选更新中时禁用所有推荐动作但保持标题', () => {
    const actions = buildTransformReportNextActionItems(buildNextActionState({
      isFilterPending: true,
      canOpenPlaceholderFill: false,
    }));

    expect(actions.every(action => action.disabled)).toBe(true);
    expect(actions[1]).toMatchObject({
      label: '查看占位符',
      title: '打开占位符回填',
      action: 'filter-placeholder',
    });
  });
});
