import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import { TransformReportActionButton } from './TransformReportActionButton';
import type { TransformReportRecordActions } from './TransformReportRecordSectionContracts';

interface TransformReportRecordCmdActionButtonsInput {
  record: TransformReportRecord;
  actions: TransformReportRecordActions;
}

export const renderTransformReportRecordCmdActionButtons = ({
  record,
  actions,
}: TransformReportRecordCmdActionButtonsInput): React.ReactNode => {
  const hasFocusedCmdStructure = Boolean(record.cmdStructureFocusPaths?.length);
  const cmdStructureTitle = hasFocusedCmdStructure
    ? `复制按当前筛选命中的${record.cmdStructureFocusLabel || '内部路径'}裁剪后的 cmdParams`
    : '复制为 cmdHandler 风格的 cmdSchema / cmdParams 结构';
  const cmdStructureLabel = hasFocusedCmdStructure ? '复制聚焦 CMD' : '复制 CMD 结构';

  return (
    <>
      <TransformReportActionButton
        data-tour="transform-report-copy-cmd-structure"
        title={cmdStructureTitle}
        onClick={() => { void actions.onCopyCmdStructure(record); }}
      >
        {cmdStructureLabel}
      </TransformReportActionButton>
      <TransformReportActionButton
        data-tour="transform-report-copy-cmd-comparison-package"
        title="复制可直接用于 cmd:diff -- --stdin 的 actual/expected 对比包"
        onClick={() => { void actions.onCopyCmdComparisonPackage(record); }}
      >
        复制对比包
      </TransformReportActionButton>
      <TransformReportActionButton
        data-tour="transform-report-open-cmd-comparison"
        tone="compare"
        title="粘贴内部 cmdHandler 输出并在页面内查看差异"
        onClick={() => actions.onToggleCmdComparison(record)}
      >
        对比 cmdHandler
      </TransformReportActionButton>
    </>
  );
};
