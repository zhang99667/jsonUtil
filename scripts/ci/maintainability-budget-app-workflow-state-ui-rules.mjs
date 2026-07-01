const stateUiBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowStateUiMaintainabilityBudgets = [
  stateUiBudget('frontend/src/utils/appEditorUiState.ts', 130, '主应用编辑区派生状态和按钮文案应集中在纯函数模块'),
  stateUiBudget('frontend/src/utils/appLazyPanelLoadState.ts', 60, '主应用懒加载面板 loaded 状态应保持纯粘性状态合并逻辑'),
];
