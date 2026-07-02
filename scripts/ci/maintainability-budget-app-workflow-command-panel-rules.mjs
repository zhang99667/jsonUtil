import { appWorkflowCommandPanelTestMaintainabilityBudgets } from './maintainability-budget-app-workflow-command-panel-test-rules.mjs';
const commandPanelBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const appWorkflowCommandPanelMaintainabilityBudgets = [
  commandPanelBudget('frontend/src/hooks/useAppToolPanelCommands.ts', 255, '主应用工具面板命令 hook 只维护面板开关、模式切换和跨面板编排，请求 ID 与请求状态不得回流'),
  commandPanelBudget('frontend/src/hooks/useAppToolPanelRequestCommands.ts', 90, '工具面板请求命令 hook 只维护 JSONPath、结构树、Scheme 和模板填充请求状态与递增 ID'),
  commandPanelBudget('frontend/src/hooks/useAppSettingsModalCommands.ts', 55, '主应用设置弹窗命令 hook 只维护初始页签、打开关闭状态和设置入口埋点'),
  commandPanelBudget('frontend/src/hooks/useAppChangelogCommands.ts', 65, '主应用 changelog 命令 hook 只维护更新日志弹窗状态、打开关闭命令和全局打开事件监听'),
  commandPanelBudget('frontend/src/utils/appToolPanelCommandPlans.ts', 120, '工具面板命令计划 helper 只维护请求 ID、面板事件名、SOURCE Scheme 判断和 Changelog 状态归一化'),
  commandPanelBudget('frontend/src/utils/appToolPanelCommandPlans.test.ts', 120, '工具面板命令计划测试只锁定请求构造、事件名、Scheme 判断、Changelog 和模板请求边界'),
  ...appWorkflowCommandPanelTestMaintainabilityBudgets,
];
