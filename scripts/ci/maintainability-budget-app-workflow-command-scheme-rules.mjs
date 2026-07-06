const commandSchemeBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowCommandSchemeMaintainabilityBudgets = [
  commandSchemeBudget('frontend/src/hooks/useAppSchemeEditCommand.ts', 25, 'Scheme 编辑命令 hook 只装配 runner 回调和当前 PREVIEW'),
  commandSchemeBudget('frontend/src/hooks/useAppSchemeEditCommand.test.ts', 55, 'Scheme 编辑命令 hook 测试只锁定参数和当前 PREVIEW 委托给 runner'),
  commandSchemeBudget('frontend/src/utils/appSchemeEditCommandRunner.ts', 35, 'Scheme 编辑命令 runner 只维护 PREVIEW 写回、成功提示和错误提示'),
  commandSchemeBudget('frontend/src/utils/appSchemeEditCommandRunner.test.ts', 70, 'Scheme 编辑命令 runner 测试只锁定成功写回和失败提示语义'),
  commandSchemeBudget('frontend/src/utils/appSchemeEditPreview.ts', 30, 'Scheme 编辑 PREVIEW helper 只维护 JSON 解析、路径写回和格式化输出'),
  commandSchemeBudget('frontend/src/utils/appSchemeEditPreview.test.ts', 50, 'Scheme 编辑 PREVIEW helper 测试只锁定 Pointer、旧 JSONPath、解析失败和 Pointer 不回退'),
];
