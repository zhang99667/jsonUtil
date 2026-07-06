import { describe, expect, it, vi } from 'vitest';
import { copyTitles } from './transformReportFooterActionTestFixture';
import type { TransformReportPanelCopyWorkflow } from './transformReportPanelCopyWorkflow';
import { buildTransformReportPanelFooterModel } from './transformReportPanelFooterModel';

const buildWorkflow = (
  overrides: Partial<TransformReportPanelCopyWorkflow> = {}
): TransformReportPanelCopyWorkflow => ({
  copyReport: vi.fn(async () => undefined),
  copyFilteredReport: vi.fn(async () => undefined),
  copyDiagnosticSummary: vi.fn(async () => undefined),
  copyQualitySnapshot: vi.fn(async () => undefined),
  setQualityBaseline: vi.fn(() => undefined),
  copyQualityBaselineDelta: vi.fn(async () => undefined),
  clearQualityBaseline: vi.fn(() => undefined),
  copyArchivePackage: vi.fn(async () => undefined),
  copyTroubleshootingRecipe: vi.fn(async () => undefined),
  copyPathValueReport: vi.fn(async () => undefined),
  copyCmdStructureReport: vi.fn(async () => undefined),
  copyPlaceholderReport: vi.fn(async () => undefined),
  copyPlaceholderFillTemplate: vi.fn(async () => undefined),
  openPlaceholderFillTemplate: vi.fn(() => undefined),
  copyIssueSamples: vi.fn(async () => undefined),
  copyIssueSampleJson: vi.fn(async () => undefined),
  copyRedactedIssueSampleJson: vi.fn(async () => undefined),
  copyIssueRegressionTemplate: vi.fn(async () => undefined),
  copyPath: vi.fn(async () => undefined),
  copyOriginalValue: vi.fn(async () => undefined),
  copyDecodedPathValue: vi.fn(async () => undefined),
  copyCmdStructure: vi.fn(async () => undefined),
  copyCmdComparisonPackage: vi.fn(async () => undefined),
  copyCmdComparisonDiff: vi.fn(async () => undefined),
  copyCollaborationReport: vi.fn(async () => undefined),
  ...overrides,
});

describe('buildTransformReportPanelFooterModel', () => {
  it('组合 footer 操作状态并映射 copy workflow handler', () => {
    const copyArchivePackage = vi.fn(async () => undefined);
    const model = buildTransformReportPanelFooterModel({
      query: 'cmd',
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
      copyWorkflow: buildWorkflow({ copyArchivePackage }),
    });

    expect(model.footerActions.slice(0, 4).map(action => action.id)).toEqual([
      'copy-filtered-report',
      'copy-collaboration-report',
      'copy-diagnostic-summary',
      'copy-quality-snapshot',
    ]);

    model.footerActionHandlers['copy-archive-package']();

    expect(copyArchivePackage).toHaveBeenCalledTimes(1);
  });
});
