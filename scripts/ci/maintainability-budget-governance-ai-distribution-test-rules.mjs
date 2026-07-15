const governanceAiDistributionTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiDistributionTestMaintainabilityBudgets = [
  governanceAiDistributionTestBudget('scripts/ci/maintainability-budget-governance-ai-distribution-test-rules.mjs', 15, 'AI 资产分发测试预算子表应独立维护三视图、全集、实现发现、发现边界和 Git 红队测试'),
  governanceAiDistributionTestBudget('scripts/ci/aiGovernanceAssetDistribution.test.mjs', 60, 'AI 资产分发测试应区分 workspace、index 与 HEAD 证据边界'),
  governanceAiDistributionTestBudget('scripts/ci/aiGovernanceAssetDistributionFiles.test.mjs', 45, 'AI 资产全集测试应锁最终并集、去重排序、预算覆盖与兼容导出'),
  governanceAiDistributionTestBudget('scripts/ci/aiGovernanceImplementationFiles.test.mjs', 50, 'AI implementation discovery 测试应直接锁 namespace、eval data、控制面与近负例'),
  governanceAiDistributionTestBudget('scripts/ci/aiGovernanceAssetDistributionDiscovery.test.mjs', 40, 'AI implementation discovery 边界测试应直接锁 symlink 与非普通节点 fail closed'),
  governanceAiDistributionTestBudget('scripts/ci/aiGovernanceAssetDistributionRedteam.test.mjs', 145, 'AI 资产 Git 红队测试应锁 assume-unchanged、symlink、mode、filter、replace refs 与 Unicode'),
  governanceAiDistributionTestBudget('scripts/ci/aiGovernanceAssetDistributionReadiness.test.mjs', 130, 'AI 资产分发就绪度测试应锁定三视图聚合、全局计数和漂移 fail-closed'),
];
