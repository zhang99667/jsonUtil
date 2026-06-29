import { describe, expect, it, vi } from 'vitest';
import {
  buildTransformReportFooterActionHandlers,
  type TransformReportFooterActionHandlerDependencies,
} from './transformReportFooterActionHandlers';
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
});
