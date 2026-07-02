import React from 'react';
import type { TransformReportWarning } from '../utils/transformSummary';
import { TransformReportActionButton } from './TransformReportActionButton';
import { SourceLabelBadge } from './TransformReportPanelAtoms';

interface TransformReportWarningsSectionProps {
  warnings: TransformReportWarning[];
  filteredWarningCount: number;
  isWarningTruncated: boolean;
  onCopyPath: (path: string) => void | Promise<void>;
  onCopyOriginalValue: (value: string) => void | Promise<void>;
  onLocatePath?: (path: string) => void;
  onOpenSchemeValue?: (value: string) => void;
}

export const TransformReportWarningsSection: React.FC<TransformReportWarningsSectionProps> = ({
  warnings,
  filteredWarningCount,
  isWarningTruncated,
  onCopyPath,
  onCopyOriginalValue,
  onLocatePath,
  onOpenSchemeValue,
}) => (
  <div data-tour="transform-report-warnings" className="flex flex-col gap-1.5">
    <div className="text-xs text-gray-500 font-medium">
      跳过记录 · {filteredWarningCount}
      {isWarningTruncated && (
        <span className="text-amber-300 ml-2">仅显示前 {warnings.length} 条</span>
      )}
    </div>
    {warnings.map(warning => (
      <div
        key={`${warning.path}:${warning.length}:${warning.limit}`}
        className="rounded border border-amber-700/50 bg-amber-900/20 px-3 py-2 text-xs"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-1.5">
            <SourceLabelBadge label={warning.sourceLabel} />
            <span className="font-mono text-amber-200 truncate" title={warning.path}>
              {warning.path}
            </span>
          </div>
          <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
            <TransformReportActionButton
              data-tour="transform-report-warning-copy-path"
              onClick={() => { void onCopyPath(warning.path); }}
            >
              复制路径
            </TransformReportActionButton>
            <TransformReportActionButton
              data-tour="transform-report-warning-copy-value"
              onClick={() => { void onCopyOriginalValue(warning.originalValue); }}
            >
              复制原始值
            </TransformReportActionButton>
            {onLocatePath && (
              <TransformReportActionButton
                data-tour="transform-report-locate-warning-path"
                onClick={() => onLocatePath(warning.path)}
                tone="locate"
              >
                定位
              </TransformReportActionButton>
            )}
            {onOpenSchemeValue && (
              <TransformReportActionButton
                data-tour="transform-report-open-warning-scheme"
                onClick={() => onOpenSchemeValue(warning.originalValue)}
                tone="scheme"
              >
                Scheme 打开
              </TransformReportActionButton>
            )}
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <span className="rounded border border-amber-700/50 bg-amber-900/30 px-2 py-0.5 text-amber-200">
            {warning.reasonLabel}
          </span>
          <span className="text-gray-300">{warning.message}</span>
        </div>
        <div className="mt-1 text-gray-400">
          下一步: {warning.nextAction}
        </div>
        <div className="mt-1 text-gray-500">
          {warning.length} 字符，阈值 {warning.limit}
        </div>
      </div>
    ))}
  </div>
);
