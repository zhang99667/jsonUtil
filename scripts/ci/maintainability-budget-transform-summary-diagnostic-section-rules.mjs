export const transformSummaryDiagnosticSectionMaintainabilityBudgets = [
  { file: 'frontend/src/utils/transformReportDiagnosticSummarySections.ts', maxLines: 15, reason: '深度解析诊断摘要 section 兼容出口应只聚合 Top、样例和建议 section helper' },
  { file: 'frontend/src/utils/transformReportDiagnosticSummaryTopSections.ts', maxLines: 95, reason: '深度解析诊断摘要 Top section 应独立维护全量分布、占位符和参数分层 Top 文案' },
  { file: 'frontend/src/utils/transformReportDiagnosticSummarySampleSections.ts', maxLines: 45, reason: '深度解析诊断摘要样例 section 应只输出脱敏后的待检查和跳过样例文案' },
  { file: 'frontend/src/utils/transformReportDiagnosticSummaryRecommendationSection.ts', maxLines: 45, reason: '深度解析诊断摘要建议 section 应独立维护风险到下一步动作的文案矩阵' },
];
