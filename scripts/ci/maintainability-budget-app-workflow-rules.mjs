import { appWorkflowSourceMaintainabilityBudgets } from './maintainability-budget-app-workflow-source-rules.mjs';

export const appWorkflowMaintainabilityBudgets = [
  ...appWorkflowSourceMaintainabilityBudgets,
  {
    file: 'frontend/src/utils/appSmartSuggestionActions.ts',
    maxLines: 100,
    reason: '智能输入建议点击策略应保持纯计划输出，副作用留在 App 主入口执行',
  },
  {
    file: 'frontend/src/utils/appSmartSuggestionActionConfig.ts',
    maxLines: 80,
    reason: '智能输入建议静态动作矩阵应集中维护，避免回流到计划 builder',
  },
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
  {
    file: 'frontend/src/utils/appActionLabels.ts',
    maxLines: 90,
    reason: '主应用操作文案 helper 应保持纯函数，避免夹带业务副作用',
  },
  {
    file: 'frontend/src/utils/appLegacyJsonPath.ts',
    maxLines: 50,
    reason: '旧 JSONPath 写值兼容逻辑应独立维护，避免回流到主应用文案 helper',
  },
  {
    file: 'frontend/src/utils/appWorkflowHelpers.ts',
    maxLines: 100,
    reason: '主应用 helper 应保持纯函数和少量编排辅助，不承载 React 状态',
  },
];
