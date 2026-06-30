import { governanceTransformSummarySupportArtifactMaintainabilityBudgets } from './maintainability-budget-governance-transform-summary-support-artifact-rules.mjs';
import { governanceTransformSummarySupportFoundationMaintainabilityBudgets } from './maintainability-budget-governance-transform-summary-support-foundation-rules.mjs';

export const governanceTransformSummarySupportMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-transform-summary-support-rules.mjs',
    maxLines: 25,
    reason: '深度解析聚合 support 预算规则应只组合子表，新增 helper 需继续拆到独立子规则',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-transform-summary-support-foundation-rules.mjs',
    maxLines: 25,
    reason: '深度解析 summary support 基础子表治理规则应独立收口，避免 support 治理入口继续贴线',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-transform-summary-support-artifact-rules.mjs',
    maxLines: 25,
    reason: '深度解析 summary support 归档、类型和洞察治理规则应独立收口，避免 support 治理入口继续贴线',
  },
  ...governanceTransformSummarySupportFoundationMaintainabilityBudgets,
  ...governanceTransformSummarySupportArtifactMaintainabilityBudgets,
];
