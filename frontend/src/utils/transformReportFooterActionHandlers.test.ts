import { describe, expect, it, vi } from 'vitest';
import {
  buildTransformReportFooterActionHandlers,
  type TransformReportFooterActionHandlerDependencies,
} from './transformReportFooterActionHandlers';
import { buildTransformReportFooterActions } from './transformReportFooterActions';
import type { TransformReportCopyTitles } from './transformReportCopyTitles';
import type { TransformReportFooterActionId } from './transformReportFooterActionTypes';

const buildDependencies = (): TransformReportFooterActionHandlerDependencies => ({
  copyFilteredReport: vi.fn(),
  copyCollaborationReport: vi.fn(),
  copyDiagnosticSummary: vi.fn(),
  copyQualitySnapshot: vi.fn(),
  setQualityBaseline: vi.fn(),
  copyQualityBaselineDelta: vi.fn(),
  clearQualityBaseline: vi.fn(),
  copyArchivePackage: vi.fn(),
  copyTroubleshootingRecipe: vi.fn(),
  copyPathValueReport: vi.fn(),
  copyCmdStructureReport: vi.fn(),
  copyIssueSamples: vi.fn(),
  copyIssueSampleJson: vi.fn(),
  copyRedactedIssueSampleJson: vi.fn(),
  copyIssueRegressionTemplate: vi.fn(),
  copyFullReport: vi.fn(),
});

const copyTitles: TransformReportCopyTitles = {
  filteredReport: '筛选标题',
  collaborationReport: '排查标题',
  diagnosticSummary: '诊断标题',
  qualitySnapshot: '质量快照标题',
  qualityBaseline: '质量对比标题',
  archivePackage: '归档标题',
  troubleshootingRecipe: 'recipe 标题',
  pathValues: '路径标题',
  cmdStructures: 'CMD 标题',
  issueSamples: '问题样本标题',
  issueSampleJson: '样本 JSON 标题',
  redactedIssueSampleJson: '脱敏 JSON 标题',
  issueRegressionTemplate: '回归模板标题',
  fullReport: '完整报告标题',
};

describe('transformReportFooterActionHandlers', () => {
  it('为每个 footer action 生成稳定 handler', () => {
    const dependencies = buildDependencies();
    const handlers = buildTransformReportFooterActionHandlers(dependencies);
    const actionIds: TransformReportFooterActionId[] = [
      'copy-filtered-report',
      'copy-collaboration-report',
      'copy-diagnostic-summary',
      'copy-quality-snapshot',
      'set-quality-baseline',
      'copy-quality-baseline-delta',
      'clear-quality-baseline',
      'copy-archive-package',
      'copy-troubleshooting-recipe',
      'copy-path-values',
      'copy-cmd-structures',
      'copy-issue-samples',
      'copy-issue-sample-json',
      'copy-redacted-issue-sample-json',
      'copy-issue-regression-template',
      'copy-full-report',
    ];

    expect(Object.keys(handlers)).toEqual(actionIds);
    actionIds.forEach(actionId => handlers[actionId]());

    expect(dependencies.copyFilteredReport).toHaveBeenCalledTimes(1);
    expect(dependencies.copyCollaborationReport).toHaveBeenCalledTimes(1);
    expect(dependencies.copyDiagnosticSummary).toHaveBeenCalledTimes(1);
    expect(dependencies.copyQualitySnapshot).toHaveBeenCalledTimes(1);
    expect(dependencies.setQualityBaseline).toHaveBeenCalledTimes(1);
    expect(dependencies.copyQualityBaselineDelta).toHaveBeenCalledTimes(1);
    expect(dependencies.clearQualityBaseline).toHaveBeenCalledTimes(1);
    expect(dependencies.copyArchivePackage).toHaveBeenCalledTimes(1);
    expect(dependencies.copyTroubleshootingRecipe).toHaveBeenCalledTimes(1);
    expect(dependencies.copyPathValueReport).toHaveBeenCalledTimes(1);
    expect(dependencies.copyCmdStructureReport).toHaveBeenCalledTimes(1);
    expect(dependencies.copyIssueSamples).toHaveBeenCalledTimes(1);
    expect(dependencies.copyIssueSampleJson).toHaveBeenCalledTimes(1);
    expect(dependencies.copyRedactedIssueSampleJson).toHaveBeenCalledTimes(1);
    expect(dependencies.copyIssueRegressionTemplate).toHaveBeenCalledTimes(1);
    expect(dependencies.copyFullReport).toHaveBeenCalledTimes(1);
  });

  it('异步 footer action 以 fire-and-forget 方式触发', () => {
    const dependencies = buildDependencies();
    dependencies.copyDiagnosticSummary = vi.fn(async () => undefined);
    const handlers = buildTransformReportFooterActionHandlers(dependencies);

    expect(handlers['copy-diagnostic-summary']()).toBeUndefined();
    expect(dependencies.copyDiagnosticSummary).toHaveBeenCalledTimes(1);
  });

  it('覆盖当前可见 footer action 的全部 handler key', () => {
    const handlers = buildTransformReportFooterActionHandlers(buildDependencies());
    const actions = buildTransformReportFooterActions({
      hasQuery: true,
      hasReportView: true,
      isFilterPending: false,
      hasQualitySnapshot: true,
      qualityBaselineFilter: '全部',
      hasQualityBaselineDeltaText: true,
      hasPathValueCopyItems: true,
      hasCmdStructureCopyItems: true,
      hasFocusedCmdStructureCopyItems: true,
      hasIssueSampleCopyText: true,
      hasIssueSampleJsonCopyText: true,
      hasRedactedIssueSampleJsonCopyText: true,
      hasIssueRegressionTemplateCopyText: true,
      hasActiveContext: true,
      copyTitles,
    });

    expect(Object.keys(handlers).sort()).toEqual(actions.map(action => action.id).sort());
  });
});
