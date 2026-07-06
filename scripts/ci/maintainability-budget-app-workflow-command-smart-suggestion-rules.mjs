const commandSmartSuggestionBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowCommandSmartSuggestionMaintainabilityBudgets = [
  commandSmartSuggestionBudget('frontend/src/hooks/useAppSmartSuggestionCommands.ts', 95, '智能建议命令 hook 只装配模式、面板和 toast 副作用，计划逻辑留在 runner/helper'),
  commandSmartSuggestionBudget('frontend/src/hooks/useAppSmartSuggestionCommands.test.ts', 120, '智能建议命令 hook 测试只锁定 runner 输入和调用方 effects 接线'),
  commandSmartSuggestionBudget('frontend/src/utils/appSmartSuggestionCommandRunner.ts', 75, '智能建议命令 runner 只维护计划分支、模式切换、提示和埋点语义'),
  commandSmartSuggestionBudget('frontend/src/utils/appSmartSuggestionPlanEffects.ts', 75, '智能建议计划副作用 helper 只维护 effect 名称到面板、输入和高亮副作用的固定顺序映射'),
  commandSmartSuggestionBudget('frontend/src/utils/appSmartSuggestionPlanEffects.test.ts', 90, '智能建议计划副作用测试只锁定执行顺序、Scheme 输入和面板打开状态'),
];
