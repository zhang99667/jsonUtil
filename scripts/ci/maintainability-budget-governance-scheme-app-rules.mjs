import { governanceSchemeSupportMaintainabilityBudgets } from './maintainability-budget-governance-scheme-support-rules.mjs';

export const governanceSchemeAppMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-scheme-app-rules.mjs',
    maxLines: 40,
    reason: 'Scheme 与主应用预算规则聚合入口应只负责组合子领域规则',
  },
  {
    file: 'scripts/ci/maintainability-budget-scheme-rules.mjs',
    maxLines: 40,
    reason: 'Scheme 预算规则聚合入口应只负责组合子领域规则',
  },
  {
    file: 'scripts/ci/maintainability-budget-scheme-core-rules.mjs',
    maxLines: 40,
    reason: 'Scheme 核心预算规则应保持短表，新增核心债务需优先拆解',
  },
  {
    file: 'scripts/ci/maintainability-budget-scheme-core-param-rules.mjs',
    maxLines: 20,
    reason: 'Scheme 参数分层预算规则应独立成短表，避免核心规则表继续贴边',
  },
  {
    file: 'scripts/ci/maintainability-budget-scheme-core-helper-rules.mjs',
    maxLines: 35,
    reason: 'Scheme 核心 helper 预算规则应独立成短表，避免核心规则表继续贴边',
  },
  {
    file: 'scripts/ci/maintainability-budget-scheme-cmd-rules.mjs',
    maxLines: 25,
    reason: 'CMD 结构预算规则应保持短表，格式化和解析预算继续分开治理',
  },
  ...governanceSchemeSupportMaintainabilityBudgets,
];
