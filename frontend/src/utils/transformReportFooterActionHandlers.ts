import type { TransformReportFooterActionId } from './transformReportFooterActionTypes';

type FooterActionEffect = () => void | Promise<void>;

export type TransformReportFooterActionHandlers = Record<TransformReportFooterActionId, () => void>;

export interface TransformReportFooterActionHandlerDependencies {
  copyFilteredReport: FooterActionEffect;
  copyCollaborationReport: FooterActionEffect;
  copyDiagnosticSummary: FooterActionEffect;
  copyQualitySnapshot: FooterActionEffect;
  setQualityBaseline: FooterActionEffect;
  copyQualityBaselineDelta: FooterActionEffect;
  clearQualityBaseline: FooterActionEffect;
  copyArchivePackage: FooterActionEffect;
  copyTroubleshootingRecipe: FooterActionEffect;
  copyPathValueReport: FooterActionEffect;
  copyCmdStructureReport: FooterActionEffect;
  copyIssueSamples: FooterActionEffect;
  copyIssueSampleJson: FooterActionEffect;
  copyRedactedIssueSampleJson: FooterActionEffect;
  copyIssueRegressionTemplate: FooterActionEffect;
  copyFullReport: FooterActionEffect;
}

export const buildTransformReportFooterActionHandlers = (
  dependencies: TransformReportFooterActionHandlerDependencies
): TransformReportFooterActionHandlers => {
  const effectHandlers: Record<TransformReportFooterActionId, FooterActionEffect> = {
    'copy-filtered-report': dependencies.copyFilteredReport,
    'copy-collaboration-report': dependencies.copyCollaborationReport,
    'copy-diagnostic-summary': dependencies.copyDiagnosticSummary,
    'copy-quality-snapshot': dependencies.copyQualitySnapshot,
    'set-quality-baseline': dependencies.setQualityBaseline,
    'copy-quality-baseline-delta': dependencies.copyQualityBaselineDelta,
    'clear-quality-baseline': dependencies.clearQualityBaseline,
    'copy-archive-package': dependencies.copyArchivePackage,
    'copy-troubleshooting-recipe': dependencies.copyTroubleshootingRecipe,
    'copy-path-values': dependencies.copyPathValueReport,
    'copy-cmd-structures': dependencies.copyCmdStructureReport,
    'copy-issue-samples': dependencies.copyIssueSamples,
    'copy-issue-sample-json': dependencies.copyIssueSampleJson,
    'copy-redacted-issue-sample-json': dependencies.copyRedactedIssueSampleJson,
    'copy-issue-regression-template': dependencies.copyIssueRegressionTemplate,
    'copy-full-report': dependencies.copyFullReport,
  };

  return Object.fromEntries(
    Object.entries(effectHandlers).map(([id, effect]) => [
      id,
      () => { void effect(); },
    ])
  ) as TransformReportFooterActionHandlers;
};
