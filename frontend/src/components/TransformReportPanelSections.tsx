import React from 'react';
import { TransformReportEmptyState } from './TransformReportEmptyState';
import { TransformReportFilterBar } from './TransformReportFilterBar';
import type { TransformReportPanelSectionsProps } from './TransformReportPanelSectionsTypes';
import { TransformReportPlaceholdersSection } from './TransformReportPlaceholdersSection';
import { TransformReportRecordsSection } from './TransformReportRecordsSection';
import { TransformReportSummarySection } from './TransformReportSummarySection';
import { TransformReportUnresolvedSection } from './TransformReportUnresolvedSection';
import { TransformReportWarningsSection } from './TransformReportWarningsSection';

export const TransformReportPanelSections: React.FC<TransformReportPanelSectionsProps> = ({
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
);
