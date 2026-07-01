import { transformSummaryDiagnosticSectionMaintainabilityBudgets } from './maintainability-budget-transform-summary-diagnostic-section-rules.mjs';

const summaryDiagnosticBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const transformSummaryDiagnosticMaintainabilityBudgets = [
  summaryDiagnosticBudget('frontend/src/utils/transformReportDiagnosticText.ts', 95, '深度解析筛选报告文本应独立维护筛选摘要、展开记录、待检查、占位符和跳过记录文案'),
  summaryDiagnosticBudget('frontend/src/utils/transformReportDiagnosticSummaryText.ts', 45, '深度解析诊断摘要入口应只维护标题、版本、筛选、覆盖和规模编排，具体 section 继续下沉'),
  ...transformSummaryDiagnosticSectionMaintainabilityBudgets,
];
