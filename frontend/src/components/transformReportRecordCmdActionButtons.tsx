import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import { TransformReportRecordActionButton } from './TransformReportRecordActionButton';

interface TransformReportRecordCmdActionButtonsInput {
  record: TransformReportRecord;
  className: string;
  onCopyCmdStructure: (record: TransformReportRecord) => void | Promise<void>;
  onCopyCmdComparisonPackage: (record: TransformReportRecord) => void | Promise<void>;
  onToggleCmdComparison: (record: TransformReportRecord) => void;
}

export const renderTransformReportRecordCmdActionButtons = ({
  record,
  className,
  onCopyCmdStructure,
  onCopyCmdComparisonPackage,
  onToggleCmdComparison,
}: TransformReportRecordCmdActionButtonsInput): React.ReactNode => {
  const hasFocusedCmdStructure = Boolean(record.cmdStructureFocusPaths?.length);
  const cmdStructureTitle = hasFocusedCmdStructure
    ? `复制按当前筛选命中的${record.cmdStructureFocusLabel || '内部路径'}裁剪后的 cmdParams`
    : '复制为 cmdHandler 风格的 cmdSchema / cmdParams 结构';
  const cmdStructureLabel = hasFocusedCmdStructure ? '复制聚焦 CMD' : '复制 CMD 结构';

  return (
    <>
      <TransformReportRecordActionButton
        data-tour="transform-report-copy-cmd-structure"
        className={className}
        title={cmdStructureTitle}
        onClick={() => { void onCopyCmdStructure(record); }}
      >
        {cmdStructureLabel}
      </TransformReportRecordActionButton>
      <TransformReportRecordActionButton
        data-tour="transform-report-copy-cmd-comparison-package"
        className={className}
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
  );
};
