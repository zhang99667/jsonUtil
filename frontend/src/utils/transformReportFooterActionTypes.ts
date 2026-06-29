import type { TransformReportCopyTitles } from './transformReportCopyTitles';
import type { ReportFooterActionTone } from './transformReportPanelStyles';

export type TransformReportFooterActionId =
  | 'copy-filtered-report'
  | 'copy-collaboration-report'
  | 'copy-diagnostic-summary'
  | 'copy-quality-snapshot'
  | 'set-quality-baseline'
  | 'copy-quality-baseline-delta'
  | 'clear-quality-baseline'
  | 'copy-archive-package'
  | 'copy-troubleshooting-recipe'
  | 'copy-path-values'
  | 'copy-cmd-structures'
  | 'copy-issue-samples'
  | 'copy-issue-sample-json'
  | 'copy-redacted-issue-sample-json'
  | 'copy-issue-regression-template'
  | 'copy-full-report';

export interface TransformReportFooterAction {
  id: TransformReportFooterActionId;
  dataTour?: string;
  label: string;
  title: string;
  ariaLabel: string;
  disabled: boolean;
  tone: ReportFooterActionTone;
}

export interface TransformReportFooterActionState {
  hasQuery: boolean;
  hasReportView: boolean;
  isFilterPending: boolean;
  hasQualitySnapshot: boolean;
  qualityBaselineFilter: string | null;
  hasQualityBaselineDeltaText: boolean;
  hasPathValueCopyItems: boolean;
  hasCmdStructureCopyItems: boolean;
  hasFocusedCmdStructureCopyItems: boolean;
  hasIssueSampleCopyText: boolean;
  hasIssueSampleJsonCopyText: boolean;
  hasRedactedIssueSampleJsonCopyText: boolean;
  hasIssueRegressionTemplateCopyText: boolean;
  hasActiveContext: boolean;
  copyTitles: TransformReportCopyTitles;
}

export type TransformReportFooterActionInput = Omit<TransformReportFooterAction, 'ariaLabel'> & {
  ariaLabel?: string;
  ariaPrefix?: string;
};
