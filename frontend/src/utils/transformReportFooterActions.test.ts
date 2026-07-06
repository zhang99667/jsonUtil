import { describe, expect, it } from 'vitest';
import {
  buildTransformReportFooterActions,
  type TransformReportFooterActionState,
} from './transformReportFooterActions';
import { copyTitles } from './transformReportFooterActionTestFixture';

const buildState = (
  overrides: Partial<TransformReportFooterActionState> = {}
): TransformReportFooterActionState => ({
  hasQuery: false,
  hasReportView: true,
  isFilterPending: false,
  hasQualitySnapshot: true,
  qualityBaselineFilter: null,
  hasQualityBaselineDeltaText: true,
  hasPathValueCopyItems: true,
  hasCmdStructureCopyItems: true,
  hasFocusedCmdStructureCopyItems: false,
  hasIssueSampleCopyText: true,
  hasIssueSampleJsonCopyText: true,
  hasRedactedIssueSampleJsonCopyText: true,
  hasIssueRegressionTemplateCopyText: true,
  hasActiveContext: true,
  copyTitles,
  ...overrides,
});

describe('transformReportFooterActions', () => {
  it('按报告复制、基线、归档、样本顺序生成 footer 操作', () => {
    const actions = buildTransformReportFooterActions(buildState());

    expect(actions.map(action => action.id)).toEqual([
      'copy-collaboration-report',
      'copy-diagnostic-summary',
      'copy-quality-snapshot',
      'set-quality-baseline',
      'copy-archive-package',
      'copy-troubleshooting-recipe',
      'copy-path-values',
      'copy-cmd-structures',
      'copy-issue-samples',
      'copy-issue-sample-json',
      'copy-redacted-issue-sample-json',
      'copy-issue-regression-template',
      'copy-full-report',
    ]);
    expect(actions.find(action => action.id === 'copy-path-values')).toMatchObject({
      label: '复制路径值',
      title: '路径标题',
      ariaLabel: '复制路径值，路径标题',
      disabled: false,
      tone: 'neutral',
    });
  });

  it('有筛选和质量基线时插入筛选、对比与清除入口', () => {
    const actions = buildTransformReportFooterActions(buildState({
      hasQuery: true,
      qualityBaselineFilter: 'CMD 参数',
      hasFocusedCmdStructureCopyItems: true,
    }));

    expect(actions.slice(0, 8).map(action => action.id)).toEqual([
      'copy-filtered-report',
      'copy-collaboration-report',
      'copy-diagnostic-summary',
      'copy-quality-snapshot',
      'set-quality-baseline',
      'copy-quality-baseline-delta',
      'clear-quality-baseline',
      'copy-archive-package',
    ]);
    expect(actions.find(action => action.id === 'copy-quality-baseline-delta')).toMatchObject({
      title: '质量对比标题；基线筛选: CMD 参数',
      ariaLabel: '复制质量对比，质量对比标题',
      tone: 'success',
    });
    expect(actions.find(action => action.id === 'copy-cmd-structures')).toMatchObject({
      label: '复制聚焦 CMD',
      ariaLabel: '复制聚焦 CMD，CMD 标题',
    });
    expect(actions.find(action => action.id === 'copy-troubleshooting-recipe')).toMatchObject({
      ariaLabel: '复制排查 recipe，recipe 标题',
    });
  });

  it('筛选更新中时禁用依赖筛选结果的操作但保留完整报告与清除基线', () => {
    const actions = buildTransformReportFooterActions(buildState({
      isFilterPending: true,
      qualityBaselineFilter: '全部',
    }));

    expect(actions.find(action => action.id === 'set-quality-baseline')).toMatchObject({
      disabled: true,
      title: '筛选结果仍在更新，请稍后设为基线',
    });
    expect(actions.find(action => action.id === 'copy-archive-package')?.disabled).toBe(true);
    expect(actions.find(action => action.id === 'copy-quality-baseline-delta')?.disabled).toBe(true);
    expect(actions.find(action => action.id === 'clear-quality-baseline')?.disabled).toBe(false);
    expect(actions.find(action => action.id === 'copy-full-report')?.disabled).toBe(false);
  });

  it('有筛选但报告视图不可用时仍展示并禁用筛选结果入口', () => {
    const actions = buildTransformReportFooterActions(buildState({
      hasQuery: true,
      hasReportView: false,
      isFilterPending: true,
    }));

    expect(actions.find(action => action.id === 'copy-filtered-report')).toMatchObject({
      title: '筛选标题',
      disabled: true,
    });
  });

  it('没有可复制内容时隐藏 CMD 入口并禁用对应按钮', () => {
    const actions = buildTransformReportFooterActions(buildState({
      hasCmdStructureCopyItems: false,
      hasPathValueCopyItems: false,
      hasIssueSampleJsonCopyText: false,
      hasActiveContext: false,
    }));

    expect(actions.some(action => action.id === 'copy-cmd-structures')).toBe(false);
    expect(actions.find(action => action.id === 'copy-path-values')?.disabled).toBe(true);
    expect(actions.find(action => action.id === 'copy-issue-samples')?.disabled).toBe(false);
    expect(actions.find(action => action.id === 'copy-issue-sample-json')?.disabled).toBe(true);
    expect(actions.find(action => action.id === 'copy-full-report')).toMatchObject({
      disabled: true,
      title: '完整报告标题',
    });
  });

  it('样本导出类 tail action 缺内容时各自禁用', () => {
    const actions = buildTransformReportFooterActions(buildState({
      hasIssueSampleCopyText: false,
      hasRedactedIssueSampleJsonCopyText: false,
      hasIssueRegressionTemplateCopyText: false,
    }));

    expect(actions.find(action => action.id === 'copy-issue-samples')?.disabled).toBe(true);
    expect(actions.find(action => action.id === 'copy-redacted-issue-sample-json')?.disabled).toBe(true);
    expect(actions.find(action => action.id === 'copy-issue-regression-template')?.disabled).toBe(true);
  });
});
