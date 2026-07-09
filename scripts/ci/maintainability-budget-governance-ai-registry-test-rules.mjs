const governanceAiRegistryTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiRegistryTestMaintainabilityBudgets = [
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceAssetRegistry.test.mjs', 110, 'AI 治理资产注册表测试应独立维护登记结构必填和重复登记负例'),
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceAssetRegistryOwner.test.mjs', 45, 'AI 治理资产注册表责任人测试应独立维护缺责任人和未知责任人负例'),
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceAssetRegistryReviewCadence.test.mjs', 45, 'AI 治理资产注册表复核节奏测试应独立维护缺复核节奏和未知复核节奏负例'),
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceAssetRegistryStatus.test.mjs', 45, 'AI 治理资产注册表状态测试应独立维护缺状态和未知状态负例'),
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceAssetRegistryStaleEntries.test.mjs', 50, 'AI 治理资产注册表陈旧登记测试应独立维护已移除资产负例'),
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceAssetRegistryEvidence.test.mjs', 60, 'AI 治理资产注册表证据测试应独立维护证据认可和未知标记负例'),
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceAssetRegistryEvidenceSources.test.mjs', 130, 'AI 治理资产注册表证据来源测试应独立维护来源反查和正向来源匹配'),
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceDiscoveredAssetTestFixtures.mjs', 45, 'AI 治理资产发现测试 fixture 应独立维护发现输入和期望资产清单'),
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceDiscoveredAssets.test.mjs', 30, 'AI 治理资产发现测试应只验证发现结果和未治理资产报告'),
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceAssetRegistrySemanticEvidence.test.mjs', 65, 'AI 治理资产注册表语义证据测试应独立维护自动发现资产不能只靠发现规则的负例'),
];
