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
  {
    file: 'scripts/ci/maintainability-budget-transform-summary-insight-rules.mjs',
    maxLines: 35,
    reason: '深度解析洞察、schema 分组和排查 recipe 预算规则应独立收口，避免 summary support 规则表继续膨胀',
  },
];
