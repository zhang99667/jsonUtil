const appWorkflowAiBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowAiMaintainabilityBudgets = [
  appWorkflowAiBudget('frontend/src/hooks/useAppAiRepairCommand.ts', 95, 'AI 修复命令 hook 只装配状态、引导和 runner effects，流程顺序留在 runner'),
  appWorkflowAiBudget('frontend/src/utils/appAiRepairCommand.ts', 80, 'AI 修复命令 helper 只维护空输入、错误提示和摘要结果组装的纯逻辑'),
  appWorkflowAiBudget('frontend/src/utils/appAiRepairCommandRunner.ts', 90, 'AI 修复命令 runner 只维护动态加载、应用结果、旧 chunk 恢复、错误提示和埋点顺序'),
  appWorkflowAiBudget('frontend/src/utils/appAiRepairCommandRunnerTypes.ts', 60, 'AI 修复命令 runner 类型契约应独立维护，避免 runner 重新膨胀'),
  appWorkflowAiBudget('frontend/src/utils/appAiRepairCommandRunner.test.ts', 120, 'AI 修复命令 runner 测试只锁定跳过、成功、API Key 和旧 chunk 恢复分支'),
  appWorkflowAiBudget('frontend/src/utils/appAiRepairCommandRunnerTestFixture.ts', 65, 'AI 修复命令 runner 测试 fixture 只维护默认配置、摘要和 effects mock'),
  appWorkflowAiBudget('frontend/src/services/aiLocalJsonRepair.ts', 50, '本地 JSON 修复只编排直接规范化、保守策略和成熟解析器'),
  appWorkflowAiBudget('frontend/src/services/aiLocalJsonRepairPolicy.ts', 110, '本地 JSON 修复策略只维护输入预算、文档形态和不臆造内容边界'),
  appWorkflowAiBudget('frontend/src/services/aiLocalJsonRepair.test.ts', 110, '本地 JSON 修复测试锁定成熟解析能力、保守拒绝边界和字符串安全'),
];
