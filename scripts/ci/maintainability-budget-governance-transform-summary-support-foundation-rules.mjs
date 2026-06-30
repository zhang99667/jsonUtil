export const governanceTransformSummarySupportFoundationMaintainabilityBudgets = [
  { file: 'scripts/ci/maintainability-budget-transform-summary-decoded-rules.mjs', maxLines: 35, reason: '深度解析 decoded 预算规则应独立收口，避免 summary support 规则表继续膨胀' },
  { file: 'scripts/ci/maintainability-budget-transform-summary-copy-rules.mjs', maxLines: 25, reason: '深度解析复制相关预算规则应独立收口，避免 summary support 规则表继续膨胀' },
  { file: 'scripts/ci/maintainability-budget-transform-summary-diagnostic-rules.mjs', maxLines: 20, reason: '深度解析诊断文本预算规则应独立收口，避免 summary support 规则表继续膨胀' },
  { file: 'scripts/ci/maintainability-budget-transform-summary-diagnostic-section-rules.mjs', maxLines: 25, reason: '深度解析诊断摘要 section 预算规则应独立收口，避免诊断规则表继续膨胀' },
];
