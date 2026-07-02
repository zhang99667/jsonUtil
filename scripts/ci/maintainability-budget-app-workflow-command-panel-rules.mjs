import { appWorkflowCommandPanelTestMaintainabilityBudgets } from './maintainability-budget-app-workflow-command-panel-test-rules.mjs';

const commandPanelBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const appWorkflowCommandPanelMaintainabilityBudgets = [
  commandPanelBudget('frontend/src/hooks/useAppToolPanelCommands.ts', 310, '主应用工具面板命令 hook 只维护面板开关、外部请求信号、changelog 监听和报告入口动作，继续增长时按面板域拆分'),
  commandPanelBudget('frontend/src/utils/appToolPanelCommandPlans.ts', 120, '工具面板命令计划 helper 只维护请求 ID、面板事件名、SOURCE Scheme 判断和 Changelog 状态归一化'),
  commandPanelBudget('frontend/src/utils/appToolPanelCommandPlans.test.ts', 120, '工具面板命令计划测试只锁定请求构造、事件名、Scheme 判断、Changelog 和模板请求边界'),
  ...appWorkflowCommandPanelTestMaintainabilityBudgets,
];
