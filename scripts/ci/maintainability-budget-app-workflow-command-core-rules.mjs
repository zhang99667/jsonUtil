const commandCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowCommandCoreMaintainabilityBudgets = [
  commandCoreBudget('frontend/src/utils/appAutoSaveTogglePlan.ts', 55, '自动保存开关计划 helper 只维护可用性校验、下一状态和 toast 文案'),
  commandCoreBudget('frontend/src/utils/appAutoSaveTogglePlan.test.ts', 70, '自动保存开关计划测试只锁定无文件、无句柄、开启和关闭四种路径'),
  commandCoreBudget('frontend/src/hooks/useAppCopyCommands.ts', 65, '复制命令 hook 只接 SOURCE/PREVIEW 文本和复制 runner，副作用分支留在可测 helper'),
  commandCoreBudget('frontend/src/utils/appCopyCommandRunner.ts', 85, '复制命令 runner 只维护空态、处理中、复制、toast 和打点语义'),
  commandCoreBudget('frontend/src/hooks/useAppSmartSuggestionCommands.ts', 95, '智能建议命令 hook 只装配模式、面板和 toast 副作用，计划逻辑留在 runner/helper'),
  commandCoreBudget('frontend/src/hooks/useAppSmartSuggestionCommands.test.ts', 120, '智能建议命令 hook 测试只锁定 runner 输入和调用方 effects 接线'),
  commandCoreBudget('frontend/src/utils/appSmartSuggestionCommandRunner.ts', 95, '智能建议命令 runner 只执行计划副作用顺序和埋点语义'),
];
