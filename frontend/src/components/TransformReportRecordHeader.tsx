import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import { SourceLabelBadge } from './TransformReportPanelAtoms';
import { TransformReportRecordHeaderActions } from './TransformReportRecordHeaderActions';

interface TransformReportRecordHeaderProps {
  record: TransformReportRecord;
  onCopyPath: (path: string, successMessage?: string) => void | Promise<void>;
  onCopyOriginalValue: (value: string, successMessage?: string) => void | Promise<void>;
  onCopyCmdStructure: (record: TransformReportRecord) => void | Promise<void>;
  onCopyCmdComparisonPackage: (record: TransformReportRecord) => void | Promise<void>;
  onToggleCmdComparison: (record: TransformReportRecord) => void;
  onLocatePath?: (path: string) => void;
  onOpenSchemeValue?: (value: string) => void;
}

export const TransformReportRecordHeader: React.FC<TransformReportRecordHeaderProps> = ({
  record,
  onCopyPath,
  onCopyOriginalValue,
  onCopyCmdStructure,
  onCopyCmdComparisonPackage,
  onToggleCmdComparison,
  onLocatePath,
  onOpenSchemeValue,
}) => {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0 flex items-center gap-1.5">
        <SourceLabelBadge label={record.sourceLabel} />
        <span className="font-mono text-emerald-300 truncate" title={record.path}>
          {record.path}
        </span>
      </div>
      <TransformReportRecordHeaderActions
        record={record}
        onCopyPath={onCopyPath}
        onCopyOriginalValue={onCopyOriginalValue}
        onCopyCmdStructure={onCopyCmdStructure}
        onCopyCmdComparisonPackage={onCopyCmdComparisonPackage}
        onToggleCmdComparison={onToggleCmdComparison}
        onLocatePath={onLocatePath}
        onOpenSchemeValue={onOpenSchemeValue}
      />
    </div>
  );
};
