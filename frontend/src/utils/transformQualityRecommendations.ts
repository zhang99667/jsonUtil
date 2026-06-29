export interface TransformQualityRecommendationSource {
  filteredWarningCount: number;
  filteredUnresolvedCount: number;
  filteredPlaceholderCount: number;
  filteredSchemeParamStageRepairHintCount: number;
  filteredNonReversibleParamStageCount: number;
  filteredCmdStructureCount: number;
}

export const buildQualitySnapshotRecommendations = (
  reportView: TransformQualityRecommendationSource
): string[] => {
  const recommendations: string[] = [];

  if (reportView.filteredWarningCount > 0) {
    recommendations.push('先处理性能保护跳过记录，必要时单独粘贴字段到 Scheme 面板或缩小 response 后再解析');
  }
  if (reportView.filteredUnresolvedCount > 0) {
    recommendations.push('将待检查项按原因分组，确认规则缺口后复制脱敏样本并沉淀回归模板');
  }
  if (reportView.filteredPlaceholderCount > 0) {
    recommendations.push('运行时占位符按来源路径确认真实替换链路，避免误判为解析失败');
  }
  if (reportView.filteredSchemeParamStageRepairHintCount > 0) {
    recommendations.push('参数分层存在修复提示，建议核对原始值、URL Decode、JSON 解析链路后沉淀回归样本');
  }
  if (reportView.filteredNonReversibleParamStageCount > 0) {
    recommendations.push('存在不可回写参数层，复制回写前需确认该字段是否只用于只读排查');
  }
  if (reportView.filteredCmdStructureCount > 0) {
    recommendations.push('对关键 CMD 结构粘贴 cmdHandler 输出做页面内对比，优先补齐缺失路径和值差异');
  }
  if (recommendations.length === 0) {
    recommendations.push('当前筛选未发现待处理风险，可将该快照作为解析质量基线保存');
  }

  return recommendations;
};
