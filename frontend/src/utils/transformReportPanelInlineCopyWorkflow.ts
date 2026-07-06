import {
  formatTransformCmdStructureComparisonPackageText,
  getTransformRecordCmdStructureCopyText,
  type TransformReportRecord,
} from './transformSummary';
import { buildCmdComparisonReportText } from './transformReportCmdComparison';
import type {
  TransformReportPanelCopyTextRunner,
  TransformReportPanelCopyWorkflowState,
  TransformReportPanelInlineCopyWorkflow,
} from './transformReportPanelCopyWorkflowTypes';

interface InlineCopyTextInput {
  text: string;
  successMessage: string;
  errorLogMessage: string;
}

export const buildTransformReportPanelInlineCopyWorkflow = (
  state: TransformReportPanelCopyWorkflowState,
  copyPanelText: TransformReportPanelCopyTextRunner
): TransformReportPanelInlineCopyWorkflow => {
  const copyInlineText = ({
    text,
    successMessage,
    errorLogMessage,
  }: InlineCopyTextInput) => copyPanelText({
    text,
    successMessage,
    errorLogMessage,
    duration: 1600,
  });

  const copyPath = (path: string, successMessage = '已复制路径') => (
    copyInlineText({ text: path, successMessage, errorLogMessage: '复制深度解析路径失败:' })
  );

  const copyOriginalValue = (value: string, successMessage = '已复制原始值') => (
    copyInlineText({ text: value, successMessage, errorLogMessage: '复制深度解析原始值失败:' })
  );

  const copyDecodedPathValue = (value: string) => (
    copyInlineText({
      text: value,
      successMessage: '已复制路径和值',
      errorLogMessage: '复制深度解析内部路径和值失败:',
    })
  );

  const copyCmdStructure = (record: TransformReportRecord) => copyInlineText({
    text: getTransformRecordCmdStructureCopyText(record),
    successMessage: record.cmdStructureFocusPaths?.length ? '已复制聚焦 CMD 结构' : '已复制 CMD 结构',
    errorLogMessage: '复制深度解析 CMD 结构失败:',
  });

  const copyCmdComparisonPackage = (record: TransformReportRecord) => copyInlineText({
    text: formatTransformCmdStructureComparisonPackageText(record),
    successMessage: '已复制 CMD 对比包',
    errorLogMessage: '复制深度解析 CMD 对比包失败:',
  });

  const copyCmdComparisonDiff = (record: TransformReportRecord) => copyInlineText({
    text: buildCmdComparisonReportText(
      record,
      state.cmdComparisonExpectedText,
      state.cmdComparisonIgnoreExtraPaths,
      state.cmdComparisonActualCandidate
    ),
    successMessage: '已复制 CMD 差异报告',
    errorLogMessage: '复制 CMD 差异报告失败:',
  });

  return {
    copyPath,
    copyOriginalValue,
    copyDecodedPathValue,
    copyCmdStructure,
    copyCmdComparisonPackage,
    copyCmdComparisonDiff,
  };
};
