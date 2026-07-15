export const appWorkflowAiMaintainabilityBudgets = [
  {
    file: 'frontend/src/hooks/useAppAiRepairCommand.ts',
    maxLines: 95,
    reason: 'AI 修复命令 hook 只装配状态、引导和 runner effects，流程顺序留在 runner',
  },
  {
    file: 'frontend/src/hooks/useAppAiRepairCommand.test.ts',
    maxLines: 215,
    reason: 'AI 修复命令 hook 测试只锁定取消、StrictMode、活动文件身份和加载竞态',
  },
  {
    file: 'frontend/src/utils/appAiRepairCommand.ts',
    maxLines: 80,
    reason: 'AI 修复命令 helper 只维护空输入、错误提示和摘要结果组装的纯逻辑',
  },
  {
    file: 'frontend/src/utils/appAiRepairCommandRunner.ts',
    maxLines: 90,
    reason: 'AI 修复命令 runner 只维护动态加载、应用结果、旧 chunk 恢复、错误提示和埋点顺序',
  },
  {
    file: 'frontend/src/utils/appAiRepairCommandRunnerTypes.ts',
    maxLines: 60,
    reason: 'AI 修复命令 runner 类型契约应独立维护，避免 runner 重新膨胀',
  },
  {
    file: 'frontend/src/utils/appAiRepairCommandRunner.test.ts',
    maxLines: 120,
    reason: 'AI 修复命令 runner 测试只锁定跳过、成功、API Key 和旧 chunk 恢复分支',
  },
  {
    file: 'frontend/src/utils/appAiRepairCommandRunnerAbort.test.ts',
    maxLines: 135,
    reason: 'AI 修复命令取消测试锁定启动、runtime 加载和 service 返回边界',
  },
  {
    file: 'frontend/src/utils/appAiRepairCommandRunnerTestFixture.ts',
    maxLines: 65,
    reason: 'AI 修复命令 runner 测试 fixture 只维护默认配置、摘要和 effects mock',
  },
];
