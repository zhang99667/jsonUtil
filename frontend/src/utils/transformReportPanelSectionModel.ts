import type { TransformContextReport, TransformReportView } from './transformSummary';
import { buildTransformReportPlaceholderToolbarState } from './transformReportPlaceholderToolbarState';
import type { TransformReportPlaceholderToolbarState } from './transformReportPlaceholderToolbarState';
import { buildTransformReportSectionVisibility } from './transformReportSectionVisibility';
import type { TransformReportSectionVisibility } from './transformReportSectionVisibility';
import {
  buildTransformReportIssueTriageItems,
  buildTransformReportNextActionItems,
} from './transformReportActionItems';
import type {
  TransformReportIssueTriageItem,
  TransformReportNextActionItem,
} from './transformReportActionItems';

interface TransformReportPanelSectionModelInput {
  report: TransformContextReport | null;
  reportView: TransformReportView | null;
  isFilterPending: boolean;
  hasTemplateFillTarget: boolean;
  hasPlaceholderFillTemplate: boolean;
  formatPlaceholderFillTitle: (readyTitle: string) => string;
  archivePackageTitle: string;
  collaborationReportTitle: string;
  qualitySnapshotTitle: string;
}

export interface TransformReportPanelSectionModel {
  placeholderFillPanelTitle: string;
  canOpenPlaceholderFill: boolean;
  placeholderToolbarState: TransformReportPlaceholderToolbarState | null;
  sectionVisibility: TransformReportSectionVisibility;
  issuePriorityCount: number;
  issueTriageItems: TransformReportIssueTriageItem[];
  nextActions: TransformReportNextActionItem[];
}

export const buildTransformReportPanelSectionModel = ({
  report,
  reportView,
  isFilterPending,
  hasTemplateFillTarget,
  hasPlaceholderFillTemplate,
  formatPlaceholderFillTitle,
  archivePackageTitle,
  collaborationReportTitle,
  qualitySnapshotTitle,
}: TransformReportPanelSectionModelInput): TransformReportPanelSectionModel => {
  const placeholderFillPanelTitle = formatPlaceholderFillTitle('把运行时占位符回填模板填入模板填充面板');
  const canOpenPlaceholderFill = Boolean(hasTemplateFillTarget && hasPlaceholderFillTemplate && !isFilterPending);
  const placeholderToolbarState = reportView ? buildTransformReportPlaceholderToolbarState({
    filteredPlaceholderCount: reportView.filteredPlaceholderCount,
    isPlaceholderTruncated: reportView.isPlaceholderTruncated,
    hasTemplateFillTarget,
    hasPlaceholderFillTemplate,
    isFilterPending,
    formatTemplateFillTitle: formatPlaceholderFillTitle,
  }) : null;
  const sectionVisibility = buildTransformReportSectionVisibility(reportView);
  const issuePriorityCount = report
    ? report.summary.unresolvedCount + report.summary.warningCount + report.summary.placeholderCount
    : 0;
  const issueTriageItems = report ? buildTransformReportIssueTriageItems({
    warningCount: report.summary.warningCount,
    unresolvedCount: report.summary.unresolvedCount,
    placeholderCount: report.summary.placeholderCount,
    canOpenPlaceholderFill,
    placeholderFillTitle: placeholderFillPanelTitle,
  }) : [];
  const nextActions = buildTransformReportNextActionItems({
    hasReport: Boolean(report),
    hasReportView: Boolean(reportView),
    hasFilteredCmdStructure: Boolean(reportView?.filteredCmdStructureCount),
    hasPlaceholders: Boolean(report?.summary.placeholderCount),
    issuePriorityCount,
    canOpenPlaceholderFill,
    isFilterPending,
    placeholderFillTitle: placeholderFillPanelTitle,
    archivePackageTitle,
    collaborationReportTitle,
    qualitySnapshotTitle,
  });

  return {
    placeholderFillPanelTitle,
    canOpenPlaceholderFill,
    placeholderToolbarState,
    sectionVisibility,
    issuePriorityCount,
    issueTriageItems,
    nextActions,
  };
};
