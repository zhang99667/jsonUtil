import { governanceTransformSummarySupportMaintainabilityBudgets } from './maintainability-budget-governance-transform-summary-support-rules.mjs';

export const governanceTransformSummaryMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-transform-summary-rules.mjs',
    maxLines: 40,
    reason: '深度解析聚合文件预算规则应保持短表，新增拆分模块需在这里收口',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-summary-text-rules.mjs',
    maxLines: 45,
    reason: '深度解析报告文本预算规则应独立收口，避免 summary 聚合预算表随文本段落继续膨胀',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-transform-summary-support-rules.mjs',
    maxLines: 40,
    reason: '深度解析 summary support 子表治理规则应独立收口，避免 summary 治理表继续贴线',
  },
  ...governanceTransformSummarySupportMaintainabilityBudgets,
];
