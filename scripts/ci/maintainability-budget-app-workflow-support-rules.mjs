import { appWorkflowSupportSmartSuggestionMaintainabilityBudgets } from './maintainability-budget-app-workflow-support-smart-suggestion-rules.mjs';

export const appWorkflowSupportMaintainabilityBudgets = [
  ...appWorkflowSupportSmartSuggestionMaintainabilityBudgets,
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
