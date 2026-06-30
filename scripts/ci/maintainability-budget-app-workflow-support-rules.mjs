export const appWorkflowSupportMaintainabilityBudgets = [
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
