export const governanceSelfMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-governance-rules.mjs',
    maxLines: 30,
    reason: '治理预算规则聚合入口应只负责组合 checker、infra、transform、Scheme/App 和自检子表',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-self-rules.mjs',
    maxLines: 45,
    reason: '治理预算自检规则应只维护治理入口和治理子表自身预算',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-checker-rules.mjs',
    maxLines: 40,
    reason: '治理 checker 与顶层聚合预算规则应保持短表',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-ai-rules.mjs',
    maxLines: 35,
    reason: 'AI 治理预算子表应独立收口，避免治理 checker 规则表继续膨胀',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-ai-registry-rules.mjs',
    maxLines: 15,
    reason: 'AI 资产注册表预算子表应独立维护注册表相关检查模块预算',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-transform-rules.mjs',
    maxLines: 80,
    reason: '深度解析预算规则自身的预算应按 transform 域独立维护',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-scheme-support-rules.mjs',
    maxLines: 60,
    reason: 'Scheme 支撑预算规则自身的预算应按 support 域独立维护',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-scheme-app-rules.mjs',
    maxLines: 60,
    reason: 'Scheme 与 App 预算规则自身的预算应按应用域维护',
  },
];
