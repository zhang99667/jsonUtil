import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import { TransformReportActionButton } from './TransformReportActionButton';
import type { TransformReportRecordActions } from './TransformReportRecordSectionContracts';
import { renderTransformReportRecordCmdActionButtons } from './transformReportRecordCmdActionButtons';

interface TransformReportRecordHeaderActionsProps {
  record: TransformReportRecord;
  actions: TransformReportRecordActions;
}

export const TransformReportRecordHeaderActions: React.FC<TransformReportRecordHeaderActionsProps> = ({
  record,
  actions,
}) => {
  return (
    <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
      {record.hasNonReversibleScheme && (
        <span className="text-amber-200 bg-amber-900/30 border border-amber-700/50 px-2 py-0.5 rounded">
          不可逆
        </span>
      )}
      <TransformReportActionButton
        data-tour="transform-report-copy-path"
        onClick={() => { void actions.onCopyPath(record.path); }}
      >
        复制路径
      </TransformReportActionButton>
      <TransformReportActionButton
        data-tour="transform-report-copy-original-value"
        onClick={() => { void actions.onCopyOriginalValue(record.originalValue); }}
      >
        复制原始值
      </TransformReportActionButton>
      {record.hasCmdStructure && renderTransformReportRecordCmdActionButtons({
        record,
        actions,
      })}
      {actions.onLocatePath && (
        <TransformReportActionButton
          data-tour="transform-report-locate-path"
          tone="locate"
          onClick={() => actions.onLocatePath?.(record.path)}
        >
          定位
        </TransformReportActionButton>
      )}
      {actions.onOpenSchemeValue && (
        <TransformReportActionButton
          data-tour="transform-report-open-scheme"
          tone="scheme"
          onClick={() => actions.onOpenSchemeValue?.(record.originalValue)}
        >
          Scheme 打开
        </TransformReportActionButton>
      )}
    </div>
  );
};
