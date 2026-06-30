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
    file: 'scripts/ci/maintainability-budget-app-workflow-state-rules.mjs',
    maxLines: 30,
    reason: 'App 状态派生预算规则应保持短表，新增状态 helper 先按异步/编辑区分层',
  },
  {
    file: 'scripts/ci/maintainability-budget-app-workflow-state-helper-rules.mjs',
    maxLines: 25,
    reason: 'App 状态 helper 预算规则应承接 PREVIEW 同步和懒加载 loaded 等专用 hook/helper',
  },
  {
    file: 'scripts/ci/maintainability-budget-app-workflow-support-rules.mjs',
    maxLines: 35,
    reason: 'App 工作流支撑 helper 预算规则应保持短表，新增建议或文案 helper 先按领域分层',
  },
];
