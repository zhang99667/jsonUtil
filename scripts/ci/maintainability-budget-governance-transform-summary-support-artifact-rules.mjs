import { governanceTransformSummarySupportInsightMaintainabilityBudgets } from './maintainability-budget-governance-transform-summary-support-insight-rules.mjs';

export const governanceTransformSummarySupportArtifactMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-transform-summary-archive-rules.mjs',
    maxLines: 25,
    reason: '深度解析协作归档预算规则应独立收口，避免 summary support 规则表继续膨胀',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-summary-types-rules.mjs',
    maxLines: 20,
    reason: '深度解析类型契约预算规则应独立收口，避免 summary support 规则表继续膨胀',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-summary-artifact-types-rules.mjs',
    maxLines: 20,
    reason: '深度解析导出物类型预算规则应独立收口，避免类型契约规则表继续膨胀',
  },
  { file: 'scripts/ci/maintainability-budget-governance-transform-summary-support-insight-rules.mjs', maxLines: 15, reason: '深度解析洞察规则治理预算应独立收口，避免 artifact 治理表继续膨胀' },
  ...governanceTransformSummarySupportInsightMaintainabilityBudgets,
];
