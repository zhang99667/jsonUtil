import React from 'react';
import type {
  TransformContextReport,
  TransformReportRecord,
  TransformReportView,
} from '../utils/transformSummary';
import type { PlaceholderFillSummary } from '../utils/transformReportPlaceholderFillSummary';
import type { TransformReportSectionVisibility } from '../utils/transformReportSectionVisibility';
import type {
  CmdComparisonCandidateInput,
  RankedCmdComparisonCandidate,
} from '../utils/transformReportCmdComparison';
import type { TransformReportPlaceholderToolbarState } from '../utils/transformReportPlaceholderToolbarState';
import type {
  TransformReportIssueTriageAction,
  TransformReportIssueTriageItem,
  TransformReportNextAction,
  TransformReportNextActionItem,
} from '../utils/transformReportActionItems';
import { TransformReportEmptyState } from './TransformReportEmptyState';
import { TransformReportFilterBar } from './TransformReportFilterBar';
import { TransformReportPlaceholdersSection } from './TransformReportPlaceholdersSection';
import { TransformReportRecordsSection } from './TransformReportRecordsSection';
import { TransformReportSummarySection } from './TransformReportSummarySection';
import { TransformReportUnresolvedSection } from './TransformReportUnresolvedSection';
import { TransformReportWarningsSection } from './TransformReportWarningsSection';

interface TransformReportPanelContentProps {
  report: TransformContextReport | null;
  reportView: TransformReportView | null;
  query: string;
  issuePriorityCount: number;
  isFilterPending: boolean;
  hasTemplateFillTarget: boolean;
  placeholderFillTemplateJsonText: string;
  placeholderFillTemplateSummary: PlaceholderFillSummary | null;
  placeholderFillPanelTitle: string;
  nextActions: TransformReportNextActionItem[];
  issueTriageItems: TransformReportIssueTriageItem[];
  sectionVisibility: TransformReportSectionVisibility;
  placeholderToolbarState: TransformReportPlaceholderToolbarState | null;
  cmdComparisonRecordPath: string | null;
  cmdComparisonActualCandidate: CmdComparisonCandidateInput | null;
  cmdComparisonExpectedText: string;
  cmdComparisonIgnoreExtraPaths: boolean;
  getCmdComparisonCandidateRecords: () => TransformReportRecord[];
  onFilter: (query: string) => void;
  onOpenFirstCmdComparison: () => void;
  onOpenPlaceholderFillTemplate: () => void;
  onCopyPlaceholderFillTemplate: () => void | Promise<void>;
  onCopyPlaceholderReport: () => void | Promise<void>;
  onRunNextAction: (action: TransformReportNextAction) => void;
  onRunIssueTriageAction: (action: TransformReportIssueTriageAction) => void;
  onCopyPath: (path: string, successMessage?: string) => void | Promise<void>;
  onCopyOriginalValue: (value: string, successMessage?: string) => void | Promise<void>;
  onCopyDecodedPathValue: (text: string) => void | Promise<void>;
  onCopyCmdStructure: (record: TransformReportRecord) => void | Promise<void>;
  onCopyCmdComparisonPackage: (record: TransformReportRecord) => void | Promise<void>;
  onToggleCmdComparison: (record: TransformReportRecord) => void;
  onCopyCmdComparisonDiff: (record: TransformReportRecord) => void | Promise<void>;
  onSwitchCmdComparisonCandidate: (candidate: RankedCmdComparisonCandidate) => void;
  onCmdComparisonExpectedTextChange: (text: string) => void;
  onCmdComparisonIgnoreExtraPathsChange: (ignoreExtraPaths: boolean) => void;
  onLocatePath?: (path: string) => void;
  onOpenSchemeValue?: (value: string) => void;
}

export const TransformReportPanelContent: React.FC<TransformReportPanelContentProps> = ({
  report,
  reportView,
  query,
  issuePriorityCount,
  isFilterPending,
  hasTemplateFillTarget,
  placeholderFillTemplateJsonText,
  placeholderFillTemplateSummary,
  placeholderFillPanelTitle,
  nextActions,
  issueTriageItems,
  sectionVisibility,
  placeholderToolbarState,
  cmdComparisonRecordPath,
  cmdComparisonActualCandidate,
  cmdComparisonExpectedText,
  cmdComparisonIgnoreExtraPaths,
  getCmdComparisonCandidateRecords,
  onFilter,
  onOpenFirstCmdComparison,
  onOpenPlaceholderFillTemplate,
  onCopyPlaceholderFillTemplate,
  onCopyPlaceholderReport,
  onRunNextAction,
  onRunIssueTriageAction,
  onCopyPath,
  onCopyOriginalValue,
  onCopyDecodedPathValue,
  onCopyCmdStructure,
  onCopyCmdComparisonPackage,
  onToggleCmdComparison,
  onCopyCmdComparisonDiff,
  onSwitchCmdComparisonCandidate,
  onCmdComparisonExpectedTextChange,
  onCmdComparisonIgnoreExtraPathsChange,
  onLocatePath,
  onOpenSchemeValue,
}) => (
  <div className="flex-1 min-h-0 overflow-y-auto bg-editor-bg p-3">
    {!report ? (
      <div className="h-full flex items-center justify-center text-xs text-gray-500">
        暂无深度解析上下文
      </div>
    ) : (
      <div className="flex flex-col gap-3">
        <TransformReportSummarySection
          report={report}
          reportView={reportView}
          issuePriorityCount={issuePriorityCount}
          isFilterPending={isFilterPending}
          hasTemplateFillTarget={hasTemplateFillTarget}
          placeholderFillTemplateJsonText={placeholderFillTemplateJsonText}
          placeholderFillTemplateSummary={placeholderFillTemplateSummary}
          placeholderFillPanelTitle={placeholderFillPanelTitle}
          nextActions={nextActions}
          issueTriageItems={issueTriageItems}
          onFilter={onFilter}
          onOpenFirstCmdComparison={onOpenFirstCmdComparison}
          onOpenPlaceholderFillTemplate={onOpenPlaceholderFillTemplate}
          onRunNextAction={onRunNextAction}
          onRunIssueTriageAction={onRunIssueTriageAction}
        />

        <TransformReportFilterBar
          query={query}
          isFilterPending={isFilterPending}
          onQueryChange={onFilter}
        />

        {reportView && sectionVisibility.showRecords && (
          <TransformReportRecordsSection
            records={reportView.records}
            filteredRecordCount={reportView.filteredRecordCount}
            isRecordTruncated={reportView.isRecordTruncated}
            cmdComparisonRecordPath={cmdComparisonRecordPath}
            cmdComparisonActualCandidate={cmdComparisonActualCandidate}
            cmdComparisonExpectedText={cmdComparisonExpectedText}
            cmdComparisonIgnoreExtraPaths={cmdComparisonIgnoreExtraPaths}
            getCmdComparisonCandidateRecords={getCmdComparisonCandidateRecords}
            onCopyPath={onCopyPath}
            onCopyOriginalValue={onCopyOriginalValue}
            onCopyDecodedPathValue={onCopyDecodedPathValue}
            onCopyCmdStructure={onCopyCmdStructure}
            onCopyCmdComparisonPackage={onCopyCmdComparisonPackage}
            onToggleCmdComparison={onToggleCmdComparison}
            onCopyCmdComparisonDiff={onCopyCmdComparisonDiff}
            onSwitchCmdComparisonCandidate={onSwitchCmdComparisonCandidate}
            onCmdComparisonExpectedTextChange={onCmdComparisonExpectedTextChange}
            onCmdComparisonIgnoreExtraPathsChange={onCmdComparisonIgnoreExtraPathsChange}
            onFilter={onFilter}
            onLocatePath={onLocatePath}
            onOpenSchemeValue={onOpenSchemeValue}
          />
        )}

        {reportView && sectionVisibility.showUnresolved && (
          <TransformReportUnresolvedSection
            unresolvedCandidates={reportView.unresolvedCandidates}
            filteredUnresolvedCount={reportView.filteredUnresolvedCount}
            isUnresolvedTruncated={reportView.isUnresolvedTruncated}
            onCopyPath={onCopyPath}
            onCopyOriginalValue={onCopyOriginalValue}
            onLocatePath={onLocatePath}
            onOpenSchemeValue={onOpenSchemeValue}
          />
        )}

        {reportView && placeholderToolbarState && sectionVisibility.showPlaceholders && (
          <TransformReportPlaceholdersSection
            runtimePlaceholderGroups={reportView.runtimePlaceholderGroups}
            runtimePlaceholders={reportView.runtimePlaceholders}
            toolbar={{
              ...placeholderToolbarState,
              onOpenPlaceholderFillTemplate,
              onCopyPlaceholderFillTemplate,
              onCopyPlaceholderReport,
            }}
            onFilter={onFilter}
            rows={{
              onCopyPath,
              onCopyOriginalValue,
              onLocatePath,
              onOpenSchemeValue,
            }}
          />
        )}

        {reportView && sectionVisibility.showWarnings && (
          <TransformReportWarningsSection
            warnings={reportView.warnings}
            filteredWarningCount={reportView.filteredWarningCount}
            isWarningTruncated={reportView.isWarningTruncated}
            onCopyPath={onCopyPath}
            onCopyOriginalValue={onCopyOriginalValue}
            onLocatePath={onLocatePath}
            onOpenSchemeValue={onOpenSchemeValue}
          />
        )}

        {reportView && sectionVisibility.showEmptyState && (
          <TransformReportEmptyState
            query={query}
            onClearFilter={() => onFilter('')}
          />
        )}
      </div>
    )}
  </div>
);
