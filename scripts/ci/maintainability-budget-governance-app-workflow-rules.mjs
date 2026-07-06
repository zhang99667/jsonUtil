import { governanceAppWorkflowCommandMaintainabilityBudgets } from './maintainability-budget-governance-app-workflow-command-rules.mjs';
import { governanceAppWorkflowStateMaintainabilityBudgets } from './maintainability-budget-governance-app-workflow-state-rules.mjs';

const governanceAppWorkflowBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAppWorkflowMaintainabilityBudgets = [
  governanceAppWorkflowBudget('scripts/ci/maintainability-budget-app-workflow-rules.mjs', 25, 'App 工作流预算聚合入口应只组合动作域、状态和支撑子表'),
  governanceAppWorkflowBudget('scripts/ci/maintainability-budget-app-workflow-ai-rules.mjs', 45, 'App AI 修复预算规则应保持短表，新增 AI 工作流 helper 先按 hook/helper 分层'),
  governanceAppWorkflowBudget('scripts/ci/maintainability-budget-governance-app-workflow-command-rules.mjs', 25, 'App 命令预算治理规则应独立维护 command/core/smart/template/panel 子表预算'),
  ...governanceAppWorkflowCommandMaintainabilityBudgets,
  governanceAppWorkflowBudget('scripts/ci/maintainability-budget-app-workflow-save-rules.mjs', 30, 'App 保存工作流预算规则应保持短表，保存命令继续增长时按计划/执行拆分'),
  governanceAppWorkflowBudget('scripts/ci/maintainability-budget-app-workflow-source-rules.mjs', 30, 'App SOURCE 替换预算规则应保持短表，新增替换 helper 先按入口/core 分层'),
  governanceAppWorkflowBudget('scripts/ci/maintainability-budget-governance-app-workflow-state-rules.mjs', 20, 'App 状态预算治理规则应独立维护 state/core/async/ui/helper 子表预算'),
  ...governanceAppWorkflowStateMaintainabilityBudgets,
  governanceAppWorkflowBudget('scripts/ci/maintainability-budget-app-workflow-support-rules.mjs', 35, 'App 工作流支撑 helper 预算规则应保持短表，新增建议或文案 helper 先按领域分层'),
  governanceAppWorkflowBudget('scripts/ci/maintainability-budget-app-workflow-support-smart-suggestion-rules.mjs', 35, 'App 智能建议支撑预算规则应独立维护建议 builder、特殊计划和静态矩阵预算'),
];
