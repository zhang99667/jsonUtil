import type {
  TransformReportIssueTriageItem,
  TransformReportNextActionItem,
} from './transformReportActionItems';
import type { TransformContextReport, TransformReportView } from './transformSummary';

export interface TransformReportPanelActionModelInput {
  report: TransformContextReport | null;
  reportView: TransformReportView | null;
  isFilterPending: boolean;
  canOpenPlaceholderFill: boolean;
  placeholderFillTitle: string;
  archivePackageTitle: string;
  collaborationReportTitle: string;
  qualitySnapshotTitle: string;
}

export interface TransformReportPanelActionModel {
  issuePriorityCount: number;
  issueTriageItems: TransformReportIssueTriageItem[];
  nextActions: TransformReportNextActionItem[];
}
