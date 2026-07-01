import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';

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

interface HeaderActionButtonInput {
  children: React.ReactNode;
  className: string;
  dataTour: string;
  title?: string;
  onClick: () => void;
}

const renderHeaderActionButton = ({
  children,
  className,
  dataTour,
  title,
  onClick,
}: HeaderActionButtonInput) => (
  <button type="button" data-tour={dataTour} onClick={onClick} className={className} title={title}>
    {children}
  </button>
);

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
      {renderHeaderActionButton({
        dataTour: 'transform-report-copy-path',
        className: cyanActionClassName,
        onClick: () => { void onCopyPath(record.path); },
        children: '复制路径',
      })}
      {renderHeaderActionButton({
        dataTour: 'transform-report-copy-original-value',
        className: cyanActionClassName,
        onClick: () => { void onCopyOriginalValue(record.originalValue); },
        children: '复制原始值',
      })}
      {record.hasCmdStructure && (
        <>
          {renderHeaderActionButton({
            dataTour: 'transform-report-copy-cmd-structure',
            className: cyanActionClassName,
            title: cmdStructureTitle,
            onClick: () => { void onCopyCmdStructure(record); },
            children: cmdStructureLabel,
          })}
          {renderHeaderActionButton({
            dataTour: 'transform-report-copy-cmd-comparison-package',
            className: cyanActionClassName,
            title: '复制可直接用于 cmd:diff -- --stdin 的 actual/expected 对比包',
            onClick: () => { void onCopyCmdComparisonPackage(record); },
            children: '复制对比包',
          })}
          {renderHeaderActionButton({
            dataTour: 'transform-report-open-cmd-comparison',
            className: 'text-gray-400 hover:text-teal-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors',
            title: '粘贴内部 cmdHandler 输出并在页面内查看差异',
            onClick: () => onToggleCmdComparison(record),
            children: '对比 cmdHandler',
          })}
        </>
      )}
      {onLocatePath && renderHeaderActionButton({
        dataTour: 'transform-report-locate-path',
        className: 'text-gray-400 hover:text-emerald-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors',
        onClick: () => onLocatePath(record.path),
        children: '定位',
      })}
      {onOpenSchemeValue && renderHeaderActionButton({
        dataTour: 'transform-report-open-scheme',
        className: 'text-gray-400 hover:text-violet-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors',
        onClick: () => onOpenSchemeValue(record.originalValue),
        children: 'Scheme 打开',
      })}
    </div>
  );
};
