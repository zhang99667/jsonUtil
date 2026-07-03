import type { TransformReportPanelActionModelInput } from './transformReportPanelActionModelTypes';

export const buildTransformReportPanelActionState = ({
  report,
  reportView,
  isFilterPending,
  canOpenPlaceholderFill,
  placeholderFillTitle,
  archivePackageTitle,
  collaborationReportTitle,
  qualitySnapshotTitle,
}: TransformReportPanelActionModelInput) => {
  const summary = report?.summary;
  const issuePriorityCount = summary
    ? summary.unresolvedCount + summary.warningCount + summary.placeholderCount
    : 0;

  return {
    issuePriorityCount,
    issueTriageState: summary ? {
      warningCount: summary.warningCount,
      unresolvedCount: summary.unresolvedCount,
      placeholderCount: summary.placeholderCount,
      canOpenPlaceholderFill,
      placeholderFillTitle,
    } : null,
    nextActionState: {
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
    },
  };
};
