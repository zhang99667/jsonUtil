const commandSchemeBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowCommandSchemeMaintainabilityBudgets = [
  commandSchemeBudget('frontend/src/hooks/useAppSchemeEditCommand.ts', 30, 'Scheme 编辑命令 hook 只维护 PREVIEW 写回 helper、成功提示和错误提示'),
  commandSchemeBudget('frontend/src/hooks/useAppSchemeEditCommand.test.ts', 65, 'Scheme 编辑命令测试只锁定成功写回和失败提示接线'),
  commandSchemeBudget('frontend/src/utils/appSchemeEditPreview.ts', 30, 'Scheme 编辑 PREVIEW helper 只维护 JSON 解析、路径写回和格式化输出'),
  commandSchemeBudget('frontend/src/utils/appSchemeEditPreview.test.ts', 50, 'Scheme 编辑 PREVIEW helper 测试只锁定 Pointer、旧 JSONPath、解析失败和 Pointer 不回退'),
];
