export const appWorkflowSourceMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/appSourceReplacePlans.ts',
    maxLines: 120,
    reason: 'SOURCE 替换入口应只保留场景文案和特殊条件，通用替换决策留在 core helper',
  },
  {
    file: 'frontend/src/utils/appSourceReplacePlanCore.ts',
    maxLines: 80,
    reason: 'SOURCE 替换通用决策应保持纯计划输出，副作用留在 App 主入口',
  },
];
