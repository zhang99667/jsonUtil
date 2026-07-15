const saveWorkflowBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowSaveMaintainabilityBudgets = [
  saveWorkflowBudget('frontend/src/hooks/useAppSaveCommands.ts', 80, 'App 保存命令 hook 只接浏览器预览另存为和 React wiring，命令执行逻辑留在可测试 runner'),
  saveWorkflowBudget('frontend/src/utils/appSaveCommandRunner.ts', 45, '保存命令 runner 只负责编排计划和打点，具体保存副作用留在 plan executor'),
  saveWorkflowBudget('frontend/src/utils/appSavePlanExecutor.ts', 35, '保存计划 executor 应集中治理 skip 处理、保存副作用调用和成功提示，不反向承载计划生成'),
  saveWorkflowBudget('frontend/src/utils/appSavePlanEffectRunner.ts', 40, '保存计划副作用 runner 应只维护保存动作到浏览器文件副作用的映射，避免打点和计划生成回流'),
  saveWorkflowBudget('frontend/src/utils/appSaveCommandTypes.ts', 35, '保存命令输入、副作用和埋点类型应集中维护，避免 runner 因契约声明回涨'),
  saveWorkflowBudget('frontend/src/utils/previewSaveFile.ts', 70, '预览另存为 helper 只封装浏览器文件保存与对应提示，保存命令分支留在 runner'),
  saveWorkflowBudget('frontend/src/utils/previewSaveFile.test.ts', 105, '预览另存为测试只锁定处理中、选择器取消、写入失败和下载回退提示'),
  saveWorkflowBudget('frontend/src/utils/appSaveActionPlan.ts', 20, 'App 保存计划入口应只保留类型和策略 re-export，具体决策拆到 shortcut/toolbar 策略'),
  saveWorkflowBudget('frontend/src/utils/appSaveShortcutPlan.ts', 60, '快捷键保存策略应只维护 PREVIEW/SOURCE、文件句柄和处理中跳过的历史语义'),
  saveWorkflowBudget('frontend/src/utils/appSaveToolbarPlan.ts', 35, '工具栏保存策略应只维护工具栏 PREVIEW 另存为和 SOURCE 保存/另存为语义'),
  saveWorkflowBudget('frontend/src/utils/appSaveActionPlanTypes.ts', 35, '保存计划输出和输入类型应集中维护，避免计划函数因类型声明贴线'),
];
