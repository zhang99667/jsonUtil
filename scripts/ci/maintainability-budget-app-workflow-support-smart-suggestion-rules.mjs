export const appWorkflowSupportSmartSuggestionMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/appSmartSuggestionActions.ts',
    maxLines: 90,
    reason: '智能输入建议点击策略应保持纯计划分发，特殊动作计划拆到独立 helper',
  },
  {
    file: 'frontend/src/utils/appSmartSuggestionSchemePlan.ts',
    maxLines: 60,
    reason: '智能输入 Scheme 面板计划应只维护 SOURCE 裁剪、空态跳过和面板打开 effects',
  },
  {
    file: 'frontend/src/utils/appSmartSuggestionSchemePlan.test.ts',
    maxLines: 55,
    reason: '智能输入 Scheme 面板计划测试只锁定空 SOURCE 和成功打开面板两条路径',
  },
  {
    file: 'frontend/src/utils/appSmartSuggestionActionConfig.ts',
    maxLines: 80,
    reason: '智能输入建议静态动作矩阵应集中维护，避免回流到计划 builder',
  },
];
