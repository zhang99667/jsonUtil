import type { ReportNextActionTone } from './transformReportPanelStyles';

export type TransformReportIssueTriageAction =
  | 'filter-warning'
  | 'filter-unresolved'
  | 'open-placeholder-fill'
  | 'filter-placeholder';

export interface TransformReportIssueTriageItem {
  key: 'warning' | 'unresolved' | 'placeholder';
  label: string;
  count: number;
  description: string;
  actionLabel: string;
  title: string;
  action: TransformReportIssueTriageAction;
}

export interface TransformReportIssueTriageState {
  warningCount: number;
  unresolvedCount: number;
  placeholderCount: number;
  canOpenPlaceholderFill: boolean;
  placeholderFillTitle: string;
}

export type TransformReportNextAction =
  | 'compare-cmd'
  | 'open-placeholder-fill'
  | 'filter-placeholder'
  | 'filter-triage'
  | 'copy-archive'
  | 'copy-collaboration'
  | 'copy-quality-snapshot';

export interface TransformReportNextActionItem {
  key: string;
  label: string;
  description: string;
  title: string;
  tone: ReportNextActionTone;
  disabled?: boolean;
  action: TransformReportNextAction;
}

export interface TransformReportNextActionState {
  hasReport: boolean;
  hasReportView: boolean;
  hasFilteredCmdStructure: boolean;
  hasPlaceholders: boolean;
  issuePriorityCount: number;
  canOpenPlaceholderFill: boolean;
  isFilterPending: boolean;
  placeholderFillTitle: string;
  archivePackageTitle: string;
  collaborationReportTitle: string;
  qualitySnapshotTitle: string;
}
