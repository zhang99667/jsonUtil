import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import { TransformReportRecordActionButton } from './TransformReportRecordActionButton';
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

const cyanActionClassName = 'text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors';

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
      <TransformReportRecordActionButton
        data-tour="transform-report-copy-path"
        className={cyanActionClassName}
        onClick={() => { void onCopyPath(record.path); }}
      >
        复制路径
      </TransformReportRecordActionButton>
      <TransformReportRecordActionButton
        data-tour="transform-report-copy-original-value"
        className={cyanActionClassName}
        onClick={() => { void onCopyOriginalValue(record.originalValue); }}
      >
        复制原始值
      </TransformReportRecordActionButton>
      {record.hasCmdStructure && renderTransformReportRecordCmdActionButtons({
        record,
        className: cyanActionClassName,
        onCopyCmdStructure,
        onCopyCmdComparisonPackage,
        onToggleCmdComparison,
      })}
      {onLocatePath && (
        <TransformReportRecordActionButton
          data-tour="transform-report-locate-path"
          className="text-gray-400 hover:text-emerald-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
          onClick={() => onLocatePath(record.path)}
        >
          定位
        </TransformReportRecordActionButton>
      )}
      {onOpenSchemeValue && (
        <TransformReportRecordActionButton
          data-tour="transform-report-open-scheme"
          className="text-gray-400 hover:text-violet-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
          onClick={() => onOpenSchemeValue(record.originalValue)}
        >
          Scheme 打开
        </TransformReportRecordActionButton>
      )}
    </div>
  );
};
