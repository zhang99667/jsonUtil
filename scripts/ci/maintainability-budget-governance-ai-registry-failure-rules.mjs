const governanceAiRegistryFailureBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiRegistryFailureMaintainabilityBudgets = [
  governanceAiRegistryFailureBudget('scripts/ci/aiGovernanceAssetRegistryFailures.mjs', 20, 'AI 治理资产注册表失败汇总入口应只编排生命周期、覆盖率和证据失败顺序'),
  governanceAiRegistryFailureBudget('scripts/ci/aiGovernanceAssetRegistryCoverageFailures.mjs', 25, 'AI 治理资产注册表覆盖率失败 helper 应独立维护缺登记和证据来源上下文错误'),
  governanceAiRegistryFailureBudget('scripts/ci/aiGovernanceAssetRegistryLifecycleFailures.mjs', 25, 'AI 治理资产注册表生命周期失败 helper 应独立维护重复登记和陈旧登记错误'),
];
