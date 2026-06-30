export const transformSummaryDiagnosticMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportDiagnosticText.ts',
    maxLines: 95,
    reason: '深度解析筛选报告文本应独立维护筛选摘要、展开记录、待检查、占位符和跳过记录文案',
  },
  {
    file: 'frontend/src/utils/transformReportDiagnosticSummaryText.ts',
    maxLines: 45,
    reason: '深度解析诊断摘要入口应只维护标题、版本、筛选、覆盖和规模编排，具体 section 继续下沉',
  },
  {
    file: 'frontend/src/utils/transformReportDiagnosticSummarySections.ts',
    maxLines: 150,
    reason: '深度解析诊断摘要 section helper 应独立维护全量 Top、当前样例和建议动作文案',
  },
];
