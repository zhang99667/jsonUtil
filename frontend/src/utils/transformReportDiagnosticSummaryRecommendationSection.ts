import type { TransformReportView } from './transformSummaryTypes';

export const appendDiagnosticSummaryRecommendationSection = (
  lines: string[],
  reportView: TransformReportView
) => {
  lines.push('', '建议:');
  if (reportView.filteredWarningCount > 0) {
    lines.push('- 先处理跳过记录，超长字段可单独粘贴到 Scheme 面板或缩小 response 后再解析');
  }
  if (reportView.filteredUnresolvedCount > 0) {
    lines.push('- 对待检查项判断是否为规则缺口；确认后可复制样本 JSON 并生成回归模板');
  }
  if (reportView.filteredPlaceholderCount > 0) {
    lines.push('- 运行时占位符通常不是解析失败，可按来源路径确认实际替换链路');
  }
  if (reportView.filteredSchemeParamStageRepairHintCount > 0) {
    lines.push('- 参数分层存在修复提示，建议核对原始值、URL Decode、JSON 解析链路后沉淀回归样本');
  }
  if (reportView.filteredNonReversibleParamStageCount > 0) {
    lines.push('- 存在不可回写参数层，复制回写前需确认该字段是否只用于只读排查');
  }
  if (
    reportView.filteredWarningCount === 0 &&
    reportView.filteredUnresolvedCount === 0 &&
    reportView.filteredPlaceholderCount === 0 &&
    reportView.filteredSchemeParamStageRepairHintCount === 0 &&
    reportView.filteredNonReversibleParamStageCount === 0
  ) {
    lines.push('- 当前筛选未发现跳过、待检查或运行时占位符，可重点核对 CMD Schema 与业务预期是否一致');
  }
};
