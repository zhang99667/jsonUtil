import React from 'react';
import type {
  TransformContextReport,
  TransformReportView,
} from '../utils/transformSummary';
import type { PlaceholderFillSummary } from '../utils/transformReportPlaceholderFillSummary';
import type {
  TransformReportIssueTriageAction,
  TransformReportIssueTriageItem,
  TransformReportNextAction,
  TransformReportNextActionItem,
} from '../utils/transformReportActionItems';
import { TransformReportCoverageCard } from './TransformReportCoverageCard';
import { TransformReportIssueTriagePanel } from './TransformReportIssueTriagePanel';
import { TransformReportNextActionsPanel } from './TransformReportNextActionsPanel';
import { TransformReportSummaryMetricsBar } from './TransformReportSummaryMetricsBar';
import { TransformReportTopDistributions } from './TransformReportTopDistributions';

interface TransformReportSummarySectionProps {
  report: TransformContextReport;
  reportView: TransformReportView | null;
  issuePriorityCount: number;
  isFilterPending: boolean;
  hasTemplateFillTarget: boolean;
  placeholderFillTemplateJsonText: string;
  placeholderFillTemplateSummary: PlaceholderFillSummary | null;
  placeholderFillPanelTitle: string;
  nextActions: TransformReportNextActionItem[];
  issueTriageItems: TransformReportIssueTriageItem[];
  onFilter: (query: string) => void;
  onOpenFirstCmdComparison: () => void;
  onOpenPlaceholderFillTemplate: () => void;
  onRunNextAction: (action: TransformReportNextAction) => void;
  onRunIssueTriageAction: (action: TransformReportIssueTriageAction) => void;
}

export const TransformReportSummarySection: React.FC<TransformReportSummarySectionProps> = ({
  report,
  reportView,
  issuePriorityCount,
  isFilterPending,
  hasTemplateFillTarget,
  placeholderFillTemplateJsonText,
  placeholderFillTemplateSummary,
  placeholderFillPanelTitle,
  nextActions,
  issueTriageItems,
  onFilter,
  onOpenFirstCmdComparison,
  onOpenPlaceholderFillTemplate,
  onRunNextAction,
  onRunIssueTriageAction,
}) => (
  <div className="rounded border border-editor-border bg-editor-sidebar px-3 py-2">
    <div className="text-xs text-cyan-200">{report.summaryText || '深度解析: 无展开记录'}</div>
    <TransformReportSummaryMetricsBar
      report={report}
      reportView={reportView}
      issuePriorityCount={issuePriorityCount}
      isFilterPending={isFilterPending}
      hasTemplateFillTarget={hasTemplateFillTarget}
      placeholderFillTemplateJsonText={placeholderFillTemplateJsonText}
      placeholderFillTemplateSummary={placeholderFillTemplateSummary}
      placeholderFillPanelTitle={placeholderFillPanelTitle}
      onFilter={onFilter}
      onOpenFirstCmdComparison={onOpenFirstCmdComparison}
      onOpenPlaceholderFillTemplate={onOpenPlaceholderFillTemplate}
    />
    <TransformReportCoverageCard coverage={report.coverage} />
    {nextActions.length > 0 && (
      <TransformReportNextActionsPanel
        nextActions={nextActions}
        onRunNextAction={onRunNextAction}
      />
    )}
    {issueTriageItems.length > 0 && (
      <TransformReportIssueTriagePanel
        issuePriorityCount={issuePriorityCount}
        issueTriageItems={issueTriageItems}
        onFilter={onFilter}
        onRunIssueTriageAction={onRunIssueTriageAction}
      />
    )}
    <TransformReportTopDistributions
      report={report}
      onFilter={onFilter}
    />
  </div>
);
