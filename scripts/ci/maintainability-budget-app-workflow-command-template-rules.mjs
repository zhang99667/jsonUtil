const commandTemplateBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowCommandTemplateMaintainabilityBudgets = [
  commandTemplateBudget('frontend/src/hooks/useAppTemplateFillCommand.ts', 75, '模板填充命令 hook 只装配动态 summary loader、ref 和 toast effects，执行顺序留在 runner'),
  commandTemplateBudget('frontend/src/utils/appTemplateFillCommandRunner.ts', 85, '模板填充命令 runner 只维护模板应用、占位符质量 delta、SOURCE 竞态保护和提示语义'),
  commandTemplateBudget('frontend/src/utils/appTemplateFillCommandRunner.test.ts', 60, '模板填充命令 runner 成功路径测试只锁定普通模板和占位符质量 delta'),
  commandTemplateBudget('frontend/src/utils/appTemplateFillCommandRunnerFailures.test.ts', 85, '模板填充命令 runner 失败路径测试只锁定 chunk 恢复、SOURCE 竞态和错误文案'),
  commandTemplateBudget('frontend/src/utils/appTemplateFillCommandRunnerTestAssertions.ts', 65, '模板填充命令 runner 测试断言 helper 只维护 SOURCE 写回、质量 delta 和错误提示断言'),
  commandTemplateBudget('frontend/src/utils/appTemplateFillCommandRunnerTestFixture.ts', 85, '模板填充命令 runner 测试 fixture 只维护模块 mock、默认 effects 和执行包装'),
  commandTemplateBudget('frontend/src/utils/appTemplateFillTargetError.ts', 45, '模板填充目标错误 helper 只维护面板状态、SOURCE 语言和校验结果文案'),
  commandTemplateBudget('frontend/src/utils/appTemplateFillTargetError.test.ts', 70, '模板填充目标错误测试只锁定空 SOURCE、非 JSON、校验失败和成功分支'),
  commandTemplateBudget('frontend/src/utils/appTemplateFillQualityDelta.ts', 65, '模板填充质量 delta helper 只维护回填前后深度解析快照和 delta 文本构造'),
  commandTemplateBudget('frontend/src/utils/appTemplateFillQualityDelta.test.ts', 70, '模板填充质量 delta 测试只锁定前后 SOURCE 快照构造和 summary 模块调用'),
];
