import type {
  TransformReportRecord,
} from './transformSummary';
import type {
  TransformReportCopyTextEffects,
  TransformReportCopyTextOptions,
} from './transformReportCopyActionRunnerTypes';
import type {
  TransformReportPanelCopyWorkflowState,
  TransformReportQualityBaseline,
} from './transformReportPanelCopyWorkflowStateTypes';

export type {
  TransformReportPanelCopyWorkflowState,
  TransformReportQualityBaseline,
} from './transformReportPanelCopyWorkflowStateTypes';

export interface TransformReportPanelCopyWorkflowEffects extends TransformReportCopyTextEffects {
  setQualityBaseline: (baseline: TransformReportQualityBaseline | null) => void;
  showStatusSuccess: (message: string, options: { duration: number }) => void;
  openTemplateFill?: (template: string) => void;
  buildActiveCmdComparisonReportText: () => string;
  buildActiveCmdComparisonCandidateText: () => string;
}

export interface TransformReportPanelCopyWorkflow {
  copyReport: () => Promise<void>;
  copyFilteredReport: () => Promise<void>;
  copyDiagnosticSummary: () => Promise<void>;
  copyQualitySnapshot: () => Promise<void>;
  setQualityBaseline: () => void;
  copyQualityBaselineDelta: () => Promise<void>;
  clearQualityBaseline: () => void;
  copyArchivePackage: () => Promise<void>;
  copyTroubleshootingRecipe: () => Promise<void>;
  copyPathValueReport: () => Promise<void>;
  copyCmdStructureReport: () => Promise<void>;
  copyPlaceholderReport: () => Promise<void>;
  copyPlaceholderFillTemplate: () => Promise<void>;
  openPlaceholderFillTemplate: () => void;
  copyIssueSamples: () => Promise<void>;
  copyIssueSampleJson: () => Promise<void>;
  copyRedactedIssueSampleJson: () => Promise<void>;
  copyIssueRegressionTemplate: () => Promise<void>;
  copyPath: (path: string, successMessage?: string) => Promise<void>;
  copyOriginalValue: (value: string, successMessage?: string) => Promise<void>;
  copyDecodedPathValue: (value: string) => Promise<void>;
  copyCmdStructure: (record: TransformReportRecord) => Promise<void>;
  copyCmdComparisonPackage: (record: TransformReportRecord) => Promise<void>;
  copyCmdComparisonDiff: (record: TransformReportRecord) => Promise<void>;
  copyCollaborationReport: () => Promise<void>;
}

export type TransformReportPanelCopyTextRunner = (options: TransformReportCopyTextOptions) => Promise<void>;

export type TransformReportPanelReportCopyWorkflow = Pick<
  TransformReportPanelCopyWorkflow,
  | 'copyReport'
  | 'copyFilteredReport'
  | 'copyDiagnosticSummary'
  | 'copyQualitySnapshot'
  | 'setQualityBaseline'
  | 'copyQualityBaselineDelta'
  | 'clearQualityBaseline'
  | 'copyArchivePackage'
  | 'copyTroubleshootingRecipe'
  | 'copyPathValueReport'
  | 'copyCmdStructureReport'
  | 'copyCollaborationReport'
>;

export type TransformReportPanelTemplateCopyWorkflow = Pick<
  TransformReportPanelCopyWorkflow,
  | 'copyPlaceholderReport'
  | 'copyPlaceholderFillTemplate'
  | 'openPlaceholderFillTemplate'
  | 'copyIssueSamples'
  | 'copyIssueSampleJson'
  | 'copyRedactedIssueSampleJson'
  | 'copyIssueRegressionTemplate'
>;

export type TransformReportPanelInlineCopyWorkflow = Pick<
  TransformReportPanelCopyWorkflow,
  | 'copyPath'
  | 'copyOriginalValue'
  | 'copyDecodedPathValue'
  | 'copyCmdStructure'
  | 'copyCmdComparisonPackage'
  | 'copyCmdComparisonDiff'
>;
