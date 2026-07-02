import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import { SourceLabelBadge } from './TransformReportPanelAtoms';
import { TransformReportRecordHeaderActions } from './TransformReportRecordHeaderActions';
import type { TransformReportRecordActions } from './TransformReportRecordSectionContracts';

interface TransformReportRecordHeaderProps {
  record: TransformReportRecord;
  actions: TransformReportRecordActions;
}

export const TransformReportRecordHeader: React.FC<TransformReportRecordHeaderProps> = ({
  record,
  actions,
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
        actions={actions}
      />
    </div>
  );
};
