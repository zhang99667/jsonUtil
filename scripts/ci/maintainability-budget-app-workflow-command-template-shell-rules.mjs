const commandTemplateShellBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowCommandTemplateShellMaintainabilityBudgets = [
  commandTemplateShellBudget('frontend/src/hooks/useAppTemplateFillCommand.ts', 60, '模板填充命令 hook 只维护目标错误计算和点击期 runner 调用装配'),
  commandTemplateShellBudget('frontend/src/utils/appTemplateFillCommandEffects.ts', 50, '模板填充命令 effects helper 只装配 ref 读写、summary 懒加载、toast 和外部回调'),
  commandTemplateShellBudget('frontend/src/utils/appTemplateFillCommandEffects.test.ts', 75, '模板填充命令 effects 测试只锁定 ref 读写、回调透传、toast 和 summary 懒加载'),
];
