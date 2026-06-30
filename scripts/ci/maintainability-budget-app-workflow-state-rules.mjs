import { appWorkflowStateHelperMaintainabilityBudgets } from './maintainability-budget-app-workflow-state-helper-rules.mjs';

export const appWorkflowStateMaintainabilityBudgets = [
  ...appWorkflowStateHelperMaintainabilityBudgets,
  {
    file: 'frontend/src/utils/appAsyncPolicy.ts',
    maxLines: 80,
    reason: '主应用异步转换与校验阈值策略应保持纯函数和集中测试',
  },
  {
    file: 'frontend/src/utils/appAsyncTransformState.ts',
    maxLines: 120,
    reason: '主应用异步转换结果 freshness 和输出选择应保持纯函数，副作用留在 App 主入口',
  },
  {
    file: 'frontend/src/utils/appEditorUiState.ts',
    maxLines: 130,
    reason: '主应用编辑区派生状态和按钮文案应集中在纯函数模块',
  },
  {
    file: 'frontend/src/utils/appLazyPanelLoadState.ts',
    maxLines: 60,
    reason: '主应用懒加载面板 loaded 状态应保持纯粘性状态合并逻辑',
  },
];
