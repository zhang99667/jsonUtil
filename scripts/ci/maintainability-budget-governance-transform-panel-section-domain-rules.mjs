export const governanceTransformPanelSectionDomainMaintainabilityBudgets = [
  { file: 'scripts/ci/maintainability-budget-transform-panel-section-rules.mjs', maxLines: 20, reason: '深度解析面板 section 预算入口应只组合 small、placeholder、summary 和 issue 子表' },
  { file: 'scripts/ci/maintainability-budget-transform-panel-section-summary-rules.mjs', maxLines: 30, reason: '深度解析 summary section 预算规则应只维护顶部总览、指标、下一步和优先处理面板' },
  { file: 'scripts/ci/maintainability-budget-transform-panel-section-issue-rules.mjs', maxLines: 20, reason: '深度解析 issue section 预算规则应只维护未展开线索和跳过记录区域' },
  { file: 'scripts/ci/maintainability-budget-governance-transform-panel-section-domain-rules.mjs', maxLines: 20, reason: '深度解析 section 领域治理规则应只维护 section 子表自身预算' },
];
