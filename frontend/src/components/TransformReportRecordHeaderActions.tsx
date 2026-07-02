import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import { TransformReportActionButton } from './TransformReportActionButton';
import { renderTransformReportRecordCmdActionButtons } from './transformReportRecordCmdActionButtons';

interface TransformReportRecordHeaderActionsProps {
  record: TransformReportRecord;
  onCopyPath: (path: string, successMessage?: string) => void | Promise<void>;
  onCopyOriginalValue: (value: string, successMessage?: string) => void | Promise<void>;
  onCopyCmdStructure: (record: TransformReportRecord) => void | Promise<void>;
  onCopyCmdComparisonPackage: (record: TransformReportRecord) => void | Promise<void>;
  onToggleCmdComparison: (record: TransformReportRecord) => void;
  onLocatePath?: (path: string) => void;
  onOpenSchemeValue?: (value: string) => void;
}

export const TransformReportRecordHeaderActions: React.FC<TransformReportRecordHeaderActionsProps> = ({
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
    <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
      {record.hasNonReversibleScheme && (
        <span className="text-amber-200 bg-amber-900/30 border border-amber-700/50 px-2 py-0.5 rounded">
          不可逆
        </span>
      )}
      <TransformReportActionButton
        data-tour="transform-report-copy-path"
        onClick={() => { void onCopyPath(record.path); }}
      >
        复制路径
      </TransformReportActionButton>
      <TransformReportActionButton
        data-tour="transform-report-copy-original-value"
        onClick={() => { void onCopyOriginalValue(record.originalValue); }}
      >
        复制原始值
      </TransformReportActionButton>
      {record.hasCmdStructure && renderTransformReportRecordCmdActionButtons({
        record,
        onCopyCmdStructure,
        onCopyCmdComparisonPackage,
        onToggleCmdComparison,
      })}
      {onLocatePath && (
        <TransformReportActionButton
          data-tour="transform-report-locate-path"
          tone="locate"
          onClick={() => onLocatePath(record.path)}
        >
          定位
        </TransformReportActionButton>
      )}
      {onOpenSchemeValue && (
        <TransformReportActionButton
          data-tour="transform-report-open-scheme"
          tone="scheme"
          onClick={() => onOpenSchemeValue(record.originalValue)}
        >
          Scheme 打开
        </TransformReportActionButton>
      )}
    </div>
  );
};
