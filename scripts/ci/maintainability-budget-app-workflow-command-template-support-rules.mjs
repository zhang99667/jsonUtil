const commandTemplateSupportBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowCommandTemplateSupportMaintainabilityBudgets = [
  commandTemplateSupportBudget('frontend/src/utils/appTemplateFillTargetError.ts', 45, '模板填充目标错误 helper 只维护面板状态、SOURCE 语言和校验结果文案'),
  commandTemplateSupportBudget('frontend/src/utils/appTemplateFillTargetError.test.ts', 70, '模板填充目标错误测试只锁定空 SOURCE、非 JSON、校验失败和成功分支'),
  commandTemplateSupportBudget('frontend/src/utils/appTemplateFillQualityDelta.ts', 65, '模板填充质量 delta helper 只维护回填前后深度解析快照和 delta 文本构造'),
  commandTemplateSupportBudget('frontend/src/utils/appTemplateFillQualityDelta.test.ts', 70, '模板填充质量 delta 测试只锁定前后 SOURCE 快照构造和 summary 模块调用'),
];
