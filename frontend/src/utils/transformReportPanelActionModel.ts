import type { TransformContextReport, TransformReportView } from './transformSummary';
import {
  buildTransformReportIssueTriageItems,
  buildTransformReportNextActionItems,
} from './transformReportActionItems';
import type {
  TransformReportIssueTriageItem,
  TransformReportNextActionItem,
} from './transformReportActionItems';

interface TransformReportPanelActionModelInput {
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

export const buildTransformReportPanelActionModel = ({
  report,
  reportView,
  isFilterPending,
  canOpenPlaceholderFill,
  placeholderFillTitle,
  archivePackageTitle,
  collaborationReportTitle,
  qualitySnapshotTitle,
}: TransformReportPanelActionModelInput): TransformReportPanelActionModel => {
  const issuePriorityCount = report
    ? report.summary.unresolvedCount + report.summary.warningCount + report.summary.placeholderCount
    : 0;
  const issueTriageItems = report ? buildTransformReportIssueTriageItems({
    warningCount: report.summary.warningCount,
    unresolvedCount: report.summary.unresolvedCount,
    placeholderCount: report.summary.placeholderCount,
    canOpenPlaceholderFill,
    placeholderFillTitle,
  }) : [];

  return {
    issuePriorityCount,
    issueTriageItems,
    nextActions: buildTransformReportNextActionItems({
      hasReport: Boolean(report),
      hasReportView: Boolean(reportView),
      hasFilteredCmdStructure: Boolean(reportView?.filteredCmdStructureCount),
      hasPlaceholders: Boolean(report?.summary.placeholderCount),
      issuePriorityCount,
      canOpenPlaceholderFill,
      isFilterPending,
      placeholderFillTitle,
      archivePackageTitle,
      collaborationReportTitle,
      qualitySnapshotTitle,
    }),
  };
};
