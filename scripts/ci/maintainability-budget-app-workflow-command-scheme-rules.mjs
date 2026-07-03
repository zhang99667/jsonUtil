const commandSchemeBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowCommandSchemeMaintainabilityBudgets = [
  commandSchemeBudget('frontend/src/hooks/useAppSchemeEditCommand.ts', 45, 'Scheme 编辑命令 hook 只维护 PREVIEW JSON 写回、成功提示和错误提示'),
  commandSchemeBudget('frontend/src/hooks/useAppSchemeEditCommand.test.ts', 92, 'Scheme 编辑命令测试只锁定 Pointer、旧 JSONPath 和失败提示路径'),
];
