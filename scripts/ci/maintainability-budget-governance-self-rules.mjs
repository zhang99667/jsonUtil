const governanceSelfBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceSelfMaintainabilityBudgets = [
  governanceSelfBudget('scripts/ci/maintainability-budget-governance-rules.mjs', 30, '治理预算规则聚合入口应只负责组合 checker、infra、transform、Scheme/App 和自检子表'),
  governanceSelfBudget('scripts/ci/maintainability-budget-governance-self-rules.mjs', 45, '治理预算自检规则应只维护治理入口和治理子表自身预算'),
  governanceSelfBudget('scripts/ci/maintainability-budget-governance-checker-rules.mjs', 40, '治理 checker 与顶层聚合预算规则应保持短表'),
  governanceSelfBudget('scripts/ci/maintainability-budget-governance-ai-rules.mjs', 25, 'AI 治理预算入口应只组合核心、引用、契约、注册表和测试子表'),
  governanceSelfBudget('scripts/ci/maintainability-budget-governance-ai-registry-rules.mjs', 15, 'AI 资产注册表预算子表应独立维护注册表相关检查模块预算'),
  governanceSelfBudget('scripts/ci/maintainability-budget-governance-transform-rules.mjs', 80, '深度解析预算规则自身的预算应按 transform 域独立维护'),
  governanceSelfBudget('scripts/ci/maintainability-budget-governance-scheme-support-rules.mjs', 60, 'Scheme 支撑预算规则自身的预算应按 support 域独立维护'),
  governanceSelfBudget('scripts/ci/maintainability-budget-governance-scheme-app-rules.mjs', 60, 'Scheme 与 App 预算规则自身的预算应按应用域维护'),
];
