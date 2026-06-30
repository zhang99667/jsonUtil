import type { TransformReportFooterActionId } from './transformReportFooterActionTypes';

type FooterActionEffect = () => void | Promise<void>;

export type TransformReportFooterActionHandlers = Record<TransformReportFooterActionId, () => void>;

const FOOTER_ACTION_EFFECT_KEYS = {
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
} as const satisfies Record<TransformReportFooterActionId, string>;

type FooterActionEffectKey = typeof FOOTER_ACTION_EFFECT_KEYS[keyof typeof FOOTER_ACTION_EFFECT_KEYS];

export type TransformReportFooterActionHandlerDependencies = Record<FooterActionEffectKey, FooterActionEffect>;

export const buildTransformReportFooterActionHandlers = (
  dependencies: TransformReportFooterActionHandlerDependencies
): TransformReportFooterActionHandlers => {
  return Object.fromEntries(
    (Object.entries(FOOTER_ACTION_EFFECT_KEYS) as Array<[TransformReportFooterActionId, FooterActionEffectKey]>)
      .map(([id, effectKey]) => [
        id,
        () => { void dependencies[effectKey](); },
      ])
  ) as TransformReportFooterActionHandlers;
};
