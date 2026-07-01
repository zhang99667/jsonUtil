import { governanceTransformSummarySupportInsightMaintainabilityBudgets } from './maintainability-budget-governance-transform-summary-support-insight-rules.mjs';

const summaryArtifactGovernanceBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceTransformSummarySupportArtifactMaintainabilityBudgets = [
  summaryArtifactGovernanceBudget('scripts/ci/maintainability-budget-transform-summary-archive-rules.mjs', 25, '深度解析协作归档预算规则应独立收口，避免 summary support 规则表继续膨胀'),
  summaryArtifactGovernanceBudget('scripts/ci/maintainability-budget-transform-summary-types-rules.mjs', 20, '深度解析类型契约预算规则应独立收口，避免 summary support 规则表继续膨胀'),
  summaryArtifactGovernanceBudget('scripts/ci/maintainability-budget-transform-summary-artifact-types-rules.mjs', 20, '深度解析导出物类型预算规则应独立收口，避免类型契约规则表继续膨胀'),
  summaryArtifactGovernanceBudget('scripts/ci/maintainability-budget-governance-transform-summary-support-insight-rules.mjs', 15, '深度解析洞察规则治理预算应独立收口，避免 artifact 治理表继续膨胀'),
  ...governanceTransformSummarySupportInsightMaintainabilityBudgets,
];
