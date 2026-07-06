import { getReportCopyTitle } from './transformReportCopyTitleHelpers';

export interface TransformReportCopyTitleState {
  hasReportView: boolean;
  isFilterPending: boolean;
  hasFilteredReport: boolean;
  hasQualityBaselineDeltaText: boolean;
  hasPathValueCopyItems: boolean;
  hasCmdStructureCopyItems: boolean;
  hasFocusedCmdStructureCopyItems: boolean;
  hasIssueSampleCopyText: boolean;
  hasIssueSampleJsonCopyText: boolean;
  hasRedactedIssueSampleJsonCopyText: boolean;
  hasIssueRegressionTemplateCopyText: boolean;
  hasActiveContext: boolean;
}

export interface TransformReportCopyTitles {
  filteredReport: string;
  collaborationReport: string;
  diagnosticSummary: string;
  qualitySnapshot: string;
  qualityBaseline: string;
  archivePackage: string;
  troubleshootingRecipe: string;
  pathValues: string;
  cmdStructures: string;
  issueSamples: string;
  issueSampleJson: string;
  redactedIssueSampleJson: string;
  issueRegressionTemplate: string;
  fullReport: string;
}

const getPanelReportCopyTitle = (
  state: Pick<TransformReportCopyTitleState, 'hasReportView' | 'isFilterPending'>,
  canCopy: boolean,
  readyTitle: string,
  unavailableTitle: string
): string => (
  getReportCopyTitle(canCopy, state.hasReportView, state.isFilterPending, readyTitle, unavailableTitle)
);

export const buildTransformReportCopyTitles = (
  state: TransformReportCopyTitleState
): TransformReportCopyTitles => ({
  filteredReport: getPanelReportCopyTitle(state, state.hasFilteredReport, '复制当前筛选命中的深度解析记录', '暂无筛选结果可复制'),
  collaborationReport: getPanelReportCopyTitle(state, state.hasReportView, '复制诊断摘要、质量快照要点和 cmdHandler 对齐状态，便于发给协作者排查', '暂无排查报告可复制'),
  diagnosticSummary: getPanelReportCopyTitle(state, state.hasReportView, '复制不含原始大字段值的解析覆盖、CMD Schema 和风险摘要', '暂无诊断摘要可复制'),
  qualitySnapshot: getPanelReportCopyTitle(state, state.hasReportView, '复制不含原始大字段值的解析质量指标 JSON，便于保存基线或对比趋势', '暂无质量快照可复制'),
  qualityBaseline: getPanelReportCopyTitle(state, state.hasQualityBaselineDeltaText, '复制当前质量快照与临时基线的指标变化', '请先设为基线后再复制质量对比'),
  archivePackage: getPanelReportCopyTitle(state, state.hasReportView, '复制不含原始 response 的质量快照、脱敏问题样本和 corpus 沉淀清单', '暂无归档包可复制'),
  troubleshootingRecipe: getPanelReportCopyTitle(state, state.hasReportView, '复制不含原始 response 的可复用排查 recipe，便于按步骤复现当前分析链路', '暂无排查 recipe 可复制'),
  pathValues: getPanelReportCopyTitle(state, state.hasPathValueCopyItems, '复制当前筛选下已索引的内部路径和值', '当前筛选没有可复制的路径和值'),
  cmdStructures: getPanelReportCopyTitle(
    state,
    state.hasCmdStructureCopyItems,
    state.hasFocusedCmdStructureCopyItems ? '复制按当前筛选聚焦后的 cmdHandler 风格 CMD 结构' : '复制当前展示的 cmdHandler 风格 CMD 结构',
    '当前筛选没有可复制的 CMD 结构'
  ),
  issueSamples: getPanelReportCopyTitle(state, state.hasIssueSampleCopyText, '复制当前筛选下的待检查、跳过和占位符来源样本', '当前筛选没有待检查、跳过或占位符来源样本可复制'),
  issueSampleJson: getPanelReportCopyTitle(state, state.hasIssueSampleJsonCopyText, '复制当前筛选下可沉淀为回归用例的结构化样本 JSON', '当前筛选没有可沉淀为回归用例的结构化样本'),
  redactedIssueSampleJson: getPanelReportCopyTitle(state, state.hasRedactedIssueSampleJsonCopyText, '复制当前筛选下的脱敏结构化样本 JSON，便于安全沉淀回归用例', '当前筛选没有可脱敏沉淀的结构化样本'),
  issueRegressionTemplate: getPanelReportCopyTitle(state, state.hasIssueRegressionTemplateCopyText, '复制当前筛选下的脱敏 Vitest TODO 回归模板', '当前筛选没有可生成回归模板的问题样本'),
  fullReport: state.hasActiveContext ? '复制完整深度解析报告' : '暂无深度解析报告可复制',
});
