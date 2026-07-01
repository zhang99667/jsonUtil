import { governanceAppWorkflowStateMaintainabilityBudgets } from './maintainability-budget-governance-app-workflow-state-rules.mjs';

export const governanceAppWorkflowMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-app-workflow-rules.mjs',
    maxLines: 25,
    reason: 'App 工作流预算聚合入口应只组合动作域、状态和支撑子表',
  },
  {
    file: 'scripts/ci/maintainability-budget-app-workflow-ai-rules.mjs',
    maxLines: 30,
    reason: 'App AI 修复预算规则应保持短表，新增 AI 工作流 helper 先按 hook/helper 分层',
  },
  {
    file: 'scripts/ci/maintainability-budget-app-workflow-command-rules.mjs',
    maxLines: 30,
    reason: 'App 命令工作流预算规则应保持短表，新增命令继续按动作域拆分',
  },
  {
    file: 'scripts/ci/maintainability-budget-app-workflow-save-rules.mjs',
    maxLines: 30,
    reason: 'App 保存工作流预算规则应保持短表，保存命令继续增长时按计划/执行拆分',
  },
  {
    file: 'scripts/ci/maintainability-budget-app-workflow-source-rules.mjs',
    maxLines: 30,
    reason: 'App SOURCE 替换预算规则应保持短表，新增替换 helper 先按入口/core 分层',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-app-workflow-state-rules.mjs',
    maxLines: 20,
    reason: 'App 状态预算治理规则应独立维护 state/core/async/ui/helper 子表预算',
  },
  ...governanceAppWorkflowStateMaintainabilityBudgets,
  {
    file: 'scripts/ci/maintainability-budget-app-workflow-support-rules.mjs',
    maxLines: 35,
    reason: 'App 工作流支撑 helper 预算规则应保持短表，新增建议或文案 helper 先按领域分层',
  },
];
