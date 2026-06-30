import { describe, expect, it, vi } from 'vitest';
import {
  buildTransformReportFooterActionHandlers,
  type TransformReportFooterActionHandlerDependencies,
} from './transformReportFooterActionHandlers';
import { buildTransformReportFooterActions } from './transformReportFooterActions';
import type { TransformReportCopyTitles } from './transformReportCopyTitles';
import type { TransformReportFooterActionId } from './transformReportFooterActionTypes';

type FooterActionDependencyKey = keyof TransformReportFooterActionHandlerDependencies;

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

const actionDependencyKeys: Record<TransformReportFooterActionId, FooterActionDependencyKey> = {
  'copy-filtered-report': 'copyFilteredReport',
  'copy-collaboration-report': 'copyCollaborationReport',
  'copy-diagnostic-summary': 'copyDiagnosticSummary',
  'copy-quality-snapshot': 'copyQualitySnapshot',
  'set-quality-baseline': 'setQualityBaseline',
  'copy-quality-baseline-delta': 'copyQualityBaselineDelta',
  'clear-quality-baseline': 'clearQualityBaseline',
  'copy-archive-package': 'copyArchivePackage',
  'copy-troubleshooting-recipe': 'copyTroubleshootingRecipe',
  'copy-path-values': 'copyPathValueReport',
  'copy-cmd-structures': 'copyCmdStructureReport',
  'copy-issue-samples': 'copyIssueSamples',
  'copy-issue-sample-json': 'copyIssueSampleJson',
  'copy-redacted-issue-sample-json': 'copyRedactedIssueSampleJson',
  'copy-issue-regression-template': 'copyIssueRegressionTemplate',
  'copy-full-report': 'copyFullReport',
};

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
    const actionIds = Object.keys(actionDependencyKeys) as TransformReportFooterActionId[];

    expect(Object.keys(handlers)).toEqual(actionIds);
    actionIds.forEach(actionId => {
      handlers[actionId]();
      expect(dependencies[actionDependencyKeys[actionId]]).toHaveBeenCalledTimes(1);
    });
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
