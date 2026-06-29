import { governanceCheckerMaintainabilityBudgets } from './maintainability-budget-governance-checker-rules.mjs';
import { governanceSchemeAppMaintainabilityBudgets } from './maintainability-budget-governance-scheme-app-rules.mjs';
import { governanceTransformMaintainabilityBudgets } from './maintainability-budget-governance-transform-rules.mjs';

export const governanceMaintainabilityBudgets = [
  ...governanceCheckerMaintainabilityBudgets,
  ...governanceTransformMaintainabilityBudgets,
  ...governanceSchemeAppMaintainabilityBudgets,
  {
    file: 'scripts/ci/maintainability-budget-governance-rules.mjs',
    maxLines: 40,
    reason: '治理预算规则聚合入口应只负责组合 checker、深度解析和 Scheme/App 子表',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-checker-rules.mjs',
    maxLines: 40,
    reason: '治理 checker 与顶层聚合预算规则应保持短表',
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
    reason: 'Scheme 与 App 预算规则自身的预算应按应用域独立维护',
  },
];
