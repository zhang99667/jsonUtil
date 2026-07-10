const governanceAiRegistryEvidenceTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiRegistryEvidenceTestMaintainabilityBudgets = [
  governanceAiRegistryEvidenceTestBudget('scripts/ci/maintainability-budget-governance-ai-registry-evidence-test-rules.mjs', 15, 'AI 治理资产注册表证据测试预算子表应独立维护证据、发现和语义测试预算条目'),
  governanceAiRegistryEvidenceTestBudget('scripts/ci/aiGovernanceAssetRegistryEvidence.test.mjs', 60, 'AI 治理资产注册表证据测试应独立维护证据认可和未知标记负例'),
  governanceAiRegistryEvidenceTestBudget('scripts/ci/aiGovernanceAssetRegistryEvidenceSources.test.mjs', 95, 'AI 治理资产注册表证据来源测试应独立维护上下文完整性和缺来源负例'),
  governanceAiRegistryEvidenceTestBudget('scripts/ci/aiGovernanceAssetRegistryEvidenceSourceMatches.test.mjs', 65, 'AI 治理资产注册表证据来源匹配测试应独立维护正向来源匹配用例'),
  governanceAiRegistryEvidenceTestBudget('scripts/ci/aiGovernanceDiscoveredAssetExpectedTestFixtures.mjs', 25, 'AI 治理资产发现期望 fixture 应独立维护期望资产清单'),
  governanceAiRegistryEvidenceTestBudget('scripts/ci/aiGovernanceDiscoveredAssetTestFixtures.mjs', 35, 'AI 治理资产发现测试 fixture 应独立维护发现输入文件'),
  governanceAiRegistryEvidenceTestBudget('scripts/ci/aiGovernanceDiscoveredAssets.test.mjs', 30, 'AI 治理资产发现测试应只验证发现结果和未治理资产报告'),
  governanceAiRegistryEvidenceTestBudget('scripts/ci/aiGovernanceAssetRegistrySemanticEvidence.test.mjs', 65, 'AI 治理资产注册表语义证据测试应独立维护自动发现资产不能只靠发现规则的负例'),
];
