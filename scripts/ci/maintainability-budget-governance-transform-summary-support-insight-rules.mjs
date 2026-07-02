export const governanceTransformSummarySupportInsightMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-transform-summary-insight-rules.mjs',
    maxLines: 35,
    reason: '深度解析洞察、schema 分组和排查 recipe 预算规则应独立收口，避免 summary support 规则表继续膨胀',
  },
  { file: 'scripts/ci/maintainability-budget-transform-summary-insight-schema-rules.mjs', maxLines: 15, reason: '深度解析 schema 分组预算入口只组合 command/resource 子表，避免 insight 规则表继续膨胀' },
  { file: 'scripts/ci/maintainability-budget-transform-summary-insight-schema-command-rules.mjs', maxLines: 20, reason: '深度解析 command schema 预算规则应独立收口，避免 schema 规则入口继续贴线' },
  { file: 'scripts/ci/maintainability-budget-transform-summary-insight-schema-resource-rules.mjs', maxLines: 15, reason: '深度解析 resource schema 预算规则应独立收口，避免 schema 规则入口继续贴线' },
];
