export const governanceTransformSummarySupportInsightMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-transform-summary-insight-rules.mjs',
    maxLines: 35,
    reason: '深度解析洞察、schema 分组和排查 recipe 预算规则应独立收口，避免 summary support 规则表继续膨胀',
  },
  { file: 'scripts/ci/maintainability-budget-transform-summary-insight-schema-rules.mjs', maxLines: 20, reason: '深度解析 schema 分组预算规则应独立收口，避免 insight 规则表继续膨胀' },
];
