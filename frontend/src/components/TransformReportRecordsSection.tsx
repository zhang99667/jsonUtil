import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import type {
  CmdComparisonCandidateInput,
  RankedCmdComparisonCandidate,
} from '../utils/transformReportCmdComparison';
import { TransformReportCmdHandlerSummary } from './TransformReportCmdHandlerSummary';
import { TransformReportCmdComparisonPanel } from './TransformReportCmdComparisonPanel';
import { TransformReportCommandSchemaRows } from './TransformReportCommandSchemaRows';
import { TransformReportRecordBadges } from './TransformReportRecordBadges';
import { TransformReportRecordHeader } from './TransformReportRecordHeader';
import { TransformReportRecordPathSections } from './TransformReportRecordPathSections';

interface TransformReportRecordsSectionProps {
  records: TransformReportRecord[];
  filteredRecordCount: number;
  isRecordTruncated: boolean;
  cmdComparisonRecordPath: string | null;
  cmdComparisonActualCandidate: CmdComparisonCandidateInput | null;
  cmdComparisonExpectedText: string;
  cmdComparisonIgnoreExtraPaths: boolean;
  getCmdComparisonCandidateRecords: () => TransformReportRecord[];
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
  onFilter: (query: string) => void;
  onLocatePath?: (path: string) => void;
  onOpenSchemeValue?: (value: string) => void;
}

export const TransformReportRecordsSection: React.FC<TransformReportRecordsSectionProps> = ({
  records,
  filteredRecordCount,
  isRecordTruncated,
  cmdComparisonRecordPath,
  cmdComparisonActualCandidate,
  cmdComparisonExpectedText,
  cmdComparisonIgnoreExtraPaths,
  getCmdComparisonCandidateRecords,
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
  onFilter,
  onLocatePath,
  onOpenSchemeValue,
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
          onCopyPath={onCopyPath}
          onCopyOriginalValue={onCopyOriginalValue}
          onCopyCmdStructure={onCopyCmdStructure}
          onCopyCmdComparisonPackage={onCopyCmdComparisonPackage}
          onToggleCmdComparison={onToggleCmdComparison}
          onLocatePath={onLocatePath}
          onOpenSchemeValue={onOpenSchemeValue}
        />
        <TransformReportRecordBadges record={record} />
        {record.hasCmdStructure && record.commandParamCount !== undefined && (
          <TransformReportCmdHandlerSummary
            record={record}
            onFilter={onFilter}
          />
        )}
        {cmdComparisonRecordPath === record.path && (
          <TransformReportCmdComparisonPanel
            record={record}
            candidateRecords={getCmdComparisonCandidateRecords()}
            expectedText={cmdComparisonExpectedText}
            ignoreExtraPaths={cmdComparisonIgnoreExtraPaths}
            activeCandidate={cmdComparisonActualCandidate?.recordPath === record.path
              ? cmdComparisonActualCandidate
              : null}
            onExpectedTextChange={onCmdComparisonExpectedTextChange}
            onIgnoreExtraPathsChange={onCmdComparisonIgnoreExtraPathsChange}
            onCopyDiff={onCopyCmdComparisonDiff}
            onToggle={onToggleCmdComparison}
            onSwitchCandidate={onSwitchCmdComparisonCandidate}
          />
        )}
        {Boolean(record.commandSchemaRows?.length) && (
          <TransformReportCommandSchemaRows
            recordPath={record.path}
            rows={record.commandSchemaRows || []}
            onCopyPath={onCopyPath}
            onCopyDecodedPathValue={onCopyDecodedPathValue}
            onLocatePath={onLocatePath}
          />
        )}
        <TransformReportRecordPathSections
          record={record}
          onCopyPath={onCopyPath}
          onCopyDecodedPathValue={onCopyDecodedPathValue}
          onLocatePath={onLocatePath}
          onOpenSchemeValue={onOpenSchemeValue}
        />
      </div>
    ))}
  </div>
);
