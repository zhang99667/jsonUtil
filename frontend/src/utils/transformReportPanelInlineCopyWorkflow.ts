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

export const buildTransformReportPanelInlineCopyWorkflow = (
  state: TransformReportPanelCopyWorkflowState,
  copyPanelText: TransformReportPanelCopyTextRunner
): TransformReportPanelInlineCopyWorkflow => {
  const copyPath = async (path: string, successMessage = '已复制路径') => {
    await copyPanelText({
      text: path,
      successMessage,
      errorLogMessage: '复制深度解析路径失败:',
      duration: 1600,
    });
  };

  const copyOriginalValue = async (value: string, successMessage = '已复制原始值') => {
    await copyPanelText({
      text: value,
      successMessage,
      errorLogMessage: '复制深度解析原始值失败:',
      duration: 1600,
    });
  };

  const copyDecodedPathValue = async (value: string) => {
    await copyPanelText({
      text: value,
      successMessage: '已复制路径和值',
      errorLogMessage: '复制深度解析内部路径和值失败:',
      duration: 1600,
    });
  };

  const copyCmdStructure = async (record: TransformReportRecord) => {
    await copyPanelText({
      text: getTransformRecordCmdStructureCopyText(record),
      successMessage: record.cmdStructureFocusPaths?.length ? '已复制聚焦 CMD 结构' : '已复制 CMD 结构',
      errorLogMessage: '复制深度解析 CMD 结构失败:',
      duration: 1600,
    });
  };

  const copyCmdComparisonPackage = async (record: TransformReportRecord) => {
    await copyPanelText({
      text: formatTransformCmdStructureComparisonPackageText(record),
      successMessage: '已复制 CMD 对比包',
      errorLogMessage: '复制深度解析 CMD 对比包失败:',
      duration: 1600,
    });
  };

  const copyCmdComparisonDiff = async (record: TransformReportRecord) => {
    await copyPanelText({
      text: buildCmdComparisonReportText(
        record,
        state.cmdComparisonExpectedText,
        state.cmdComparisonIgnoreExtraPaths,
        state.cmdComparisonActualCandidate
      ),
      successMessage: '已复制 CMD 差异报告',
      errorLogMessage: '复制 CMD 差异报告失败:',
      duration: 1600,
    });
  };

  return {
    copyPath,
    copyOriginalValue,
    copyDecodedPathValue,
    copyCmdStructure,
    copyCmdComparisonPackage,
    copyCmdComparisonDiff,
  };
};
