import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import { SourceLabelBadge } from './TransformReportPanelAtoms';

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
  const hasFocusedCmdStructure = Boolean(record.cmdStructureFocusPaths?.length);
  const cmdStructureTitle = hasFocusedCmdStructure
    ? `复制按当前筛选命中的${record.cmdStructureFocusLabel || '内部路径'}裁剪后的 cmdParams`
    : '复制为 cmdHandler 风格的 cmdSchema / cmdParams 结构';
  const cmdStructureLabel = hasFocusedCmdStructure ? '复制聚焦 CMD' : '复制 CMD 结构';

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0 flex items-center gap-1.5">
        <SourceLabelBadge label={record.sourceLabel} />
        <span className="font-mono text-emerald-300 truncate" title={record.path}>
          {record.path}
        </span>
      </div>
      <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
        {record.hasNonReversibleScheme && (
          <span className="text-amber-200 bg-amber-900/30 border border-amber-700/50 px-2 py-0.5 rounded">
            不可逆
          </span>
        )}
        <button
          type="button"
          data-tour="transform-report-copy-path"
          onClick={() => { void onCopyPath(record.path); }}
          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
        >
          复制路径
        </button>
        <button
          type="button"
          data-tour="transform-report-copy-original-value"
          onClick={() => { void onCopyOriginalValue(record.originalValue); }}
          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
        >
          复制原始值
        </button>
        {record.hasCmdStructure && (
          <>
            <button
              type="button"
              data-tour="transform-report-copy-cmd-structure"
              onClick={() => { void onCopyCmdStructure(record); }}
              className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
              title={cmdStructureTitle}
            >
              {cmdStructureLabel}
            </button>
            <button
              type="button"
              data-tour="transform-report-copy-cmd-comparison-package"
              onClick={() => { void onCopyCmdComparisonPackage(record); }}
              className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
              title="复制可直接用于 cmd:diff -- --stdin 的 actual/expected 对比包"
            >
              复制对比包
            </button>
            <button
              type="button"
              data-tour="transform-report-open-cmd-comparison"
              onClick={() => onToggleCmdComparison(record)}
              className="text-gray-400 hover:text-teal-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
              title="粘贴内部 cmdHandler 输出并在页面内查看差异"
            >
              对比 cmdHandler
            </button>
          </>
        )}
        {onLocatePath && (
          <button
            type="button"
            data-tour="transform-report-locate-path"
            onClick={() => onLocatePath(record.path)}
            className="text-gray-400 hover:text-emerald-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
          >
            定位
          </button>
        )}
        {onOpenSchemeValue && (
          <button
            type="button"
            data-tour="transform-report-open-scheme"
            onClick={() => onOpenSchemeValue(record.originalValue)}
            className="text-gray-400 hover:text-violet-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
          >
            Scheme 打开
          </button>
        )}
      </div>
    </div>
  );
};
