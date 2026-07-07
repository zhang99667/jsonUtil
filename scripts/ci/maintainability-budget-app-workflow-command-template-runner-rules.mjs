const commandTemplateRunnerBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowCommandTemplateRunnerMaintainabilityBudgets = [
  commandTemplateRunnerBudget('frontend/src/utils/appTemplateFillCommandRunner.ts', 55, '模板填充命令 runner 只维护 SOURCE 竞态保护、摘要模块加载、结果提交和失败提示语义'),
  commandTemplateRunnerBudget('frontend/src/utils/appTemplateFillCommandBuildResult.ts', 45, '模板填充命令结果构建 helper 应只维护模板应用和可选质量 delta 计算'),
  commandTemplateRunnerBudget('frontend/src/utils/appTemplateFillCommandSourceGuard.ts', 20, '模板填充命令 SOURCE guard 应只维护内容变化阻断和提示副作用'),
  commandTemplateRunnerBudget('frontend/src/utils/appTemplateFillCommandRunnerTypes.ts', 30, '模板填充命令 runner 类型契约应独立维护，避免执行流程被 effects 声明撑大'),
  commandTemplateRunnerBudget('frontend/src/utils/appTemplateFillCommandRunner.test.ts', 60, '模板填充命令 runner 成功路径测试只锁定普通模板和占位符质量 delta'),
  commandTemplateRunnerBudget('frontend/src/utils/appTemplateFillCommandRunnerFailures.test.ts', 85, '模板填充命令 runner 失败路径测试只锁定 chunk 恢复、占位符降级成功和错误文案'),
  commandTemplateRunnerBudget('frontend/src/utils/appTemplateFillCommandRunnerTestAssertions.ts', 65, '模板填充命令 runner 测试断言 helper 只维护 SOURCE 写回、质量 delta、降级成功和错误提示断言'),
  commandTemplateRunnerBudget('frontend/src/utils/appTemplateFillCommandRunnerTestFixture.ts', 85, '模板填充命令 runner 测试 fixture 只维护模块 mock、默认 effects 和执行包装'),
];
