import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import { TransformReportRecordActionButton } from './TransformReportRecordActionButton';

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
  const hasFocusedCmdStructure = Boolean(record.cmdStructureFocusPaths?.length);
  const cmdStructureTitle = hasFocusedCmdStructure
    ? `复制按当前筛选命中的${record.cmdStructureFocusLabel || '内部路径'}裁剪后的 cmdParams`
    : '复制为 cmdHandler 风格的 cmdSchema / cmdParams 结构';
  const cmdStructureLabel = hasFocusedCmdStructure ? '复制聚焦 CMD' : '复制 CMD 结构';

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
      {record.hasCmdStructure && (
        <>
          <TransformReportRecordActionButton
            data-tour="transform-report-copy-cmd-structure"
            className={cyanActionClassName}
            title={cmdStructureTitle}
            onClick={() => { void onCopyCmdStructure(record); }}
          >
            {cmdStructureLabel}
          </TransformReportRecordActionButton>
          <TransformReportRecordActionButton
            data-tour="transform-report-copy-cmd-comparison-package"
            className={cyanActionClassName}
            title="复制可直接用于 cmd:diff -- --stdin 的 actual/expected 对比包"
            onClick={() => { void onCopyCmdComparisonPackage(record); }}
          >
            复制对比包
          </TransformReportRecordActionButton>
          <TransformReportRecordActionButton
            data-tour="transform-report-open-cmd-comparison"
            className="text-gray-400 hover:text-teal-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
            title="粘贴内部 cmdHandler 输出并在页面内查看差异"
            onClick={() => onToggleCmdComparison(record)}
          >
            对比 cmdHandler
          </TransformReportRecordActionButton>
        </>
      )}
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
