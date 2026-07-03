const commandTemplateRunnerBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowCommandTemplateRunnerMaintainabilityBudgets = [
  commandTemplateRunnerBudget('frontend/src/utils/appTemplateFillCommandRunner.ts', 85, '模板填充命令 runner 只维护模板应用、占位符质量 delta、SOURCE 竞态保护和提示语义'),
  commandTemplateRunnerBudget('frontend/src/utils/appTemplateFillCommandRunner.test.ts', 60, '模板填充命令 runner 成功路径测试只锁定普通模板和占位符质量 delta'),
  commandTemplateRunnerBudget('frontend/src/utils/appTemplateFillCommandRunnerFailures.test.ts', 85, '模板填充命令 runner 失败路径测试只锁定 chunk 恢复、SOURCE 竞态和错误文案'),
  commandTemplateRunnerBudget('frontend/src/utils/appTemplateFillCommandRunnerTestAssertions.ts', 65, '模板填充命令 runner 测试断言 helper 只维护 SOURCE 写回、质量 delta 和错误提示断言'),
  commandTemplateRunnerBudget('frontend/src/utils/appTemplateFillCommandRunnerTestFixture.ts', 85, '模板填充命令 runner 测试 fixture 只维护模块 mock、默认 effects 和执行包装'),
];
