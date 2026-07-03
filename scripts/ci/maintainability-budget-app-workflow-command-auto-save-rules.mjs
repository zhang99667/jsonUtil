const autoSaveCommandBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowCommandAutoSaveMaintainabilityBudgets = [
  autoSaveCommandBudget('frontend/src/utils/appAutoSaveTogglePlan.ts', 55, '自动保存开关计划 helper 只维护可用性校验、下一状态和 toast 文案'),
  autoSaveCommandBudget('frontend/src/utils/appAutoSaveTogglePlan.test.ts', 70, '自动保存开关计划测试只锁定无文件、无句柄、开启和关闭四种路径'),
  autoSaveCommandBudget('frontend/src/hooks/useAppAutoSaveToggleCommand.ts', 45, '自动保存开关 hook 只装配计划 helper、状态 setter 和 toast 副作用'),
  autoSaveCommandBudget('frontend/src/hooks/useAppAutoSaveToggleCommand.test.ts', 90, '自动保存开关 hook 测试只锁定错误提示、状态写入和成功提示'),
];
