import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import { TransformReportCmdHandlerSummary } from './TransformReportCmdHandlerSummary';
import { TransformReportCmdComparisonPanel } from './TransformReportCmdComparisonPanel';
import { TransformReportCommandSchemaRows } from './TransformReportCommandSchemaRows';
import { TransformReportRecordBadges } from './TransformReportRecordBadges';
import { TransformReportRecordHeader } from './TransformReportRecordHeader';
import { TransformReportRecordPathSections } from './TransformReportRecordPathSections';
import type {
  TransformReportRecordActions,
  TransformReportRecordCmdComparisonState,
} from './TransformReportRecordSectionContracts';

interface TransformReportRecordsSectionProps {
  records: TransformReportRecord[];
  filteredRecordCount: number;
  isRecordTruncated: boolean;
  actions: TransformReportRecordActions;
  cmdComparison: TransformReportRecordCmdComparisonState;
  onFilter: (query: string) => void;
}

export const TransformReportRecordsSection: React.FC<TransformReportRecordsSectionProps> = ({
  records,
  filteredRecordCount,
  isRecordTruncated,
  actions,
  cmdComparison,
  onFilter,
}) => (
  <div data-tour="transform-report-records" className="flex flex-col gap-1.5">
    <div className="text-xs text-gray-500 font-medium">
      展开记录 · {filteredRecordCount}
      {isRecordTruncated && (
        <span className="text-amber-300 ml-2">仅显示前 {records.length} 条</span>
      )}
    </div>
    {records.map(record => (
      <div
        key={record.path}
        data-tour="transform-report-row"
        className="rounded border border-editor-border bg-editor-sidebar px-3 py-2 text-xs"
      >
        <TransformReportRecordHeader
          record={record}
          actions={actions}
        />
        <TransformReportRecordBadges record={record} />
        {record.hasCmdStructure && record.commandParamCount !== undefined && (
          <TransformReportCmdHandlerSummary
            record={record}
            onFilter={onFilter}
          />
        )}
        {cmdComparison.recordPath === record.path && (
          <TransformReportCmdComparisonPanel
            record={record}
            candidateRecords={cmdComparison.getCandidateRecords()}
            expectedText={cmdComparison.expectedText}
            ignoreExtraPaths={cmdComparison.ignoreExtraPaths}
            activeCandidate={cmdComparison.actualCandidate?.recordPath === record.path
              ? cmdComparison.actualCandidate
              : null}
            onExpectedTextChange={actions.onCmdComparisonExpectedTextChange}
            onIgnoreExtraPathsChange={actions.onCmdComparisonIgnoreExtraPathsChange}
            onCopyDiff={actions.onCopyCmdComparisonDiff}
            onToggle={actions.onToggleCmdComparison}
            onSwitchCandidate={actions.onSwitchCmdComparisonCandidate}
          />
        )}
        {Boolean(record.commandSchemaRows?.length) && (
          <TransformReportCommandSchemaRows
            recordPath={record.path}
            rows={record.commandSchemaRows || []}
            actions={actions}
          />
        )}
        <TransformReportRecordPathSections
          record={record}
          actions={actions}
        />
      </div>
    ))}
  </div>
);
