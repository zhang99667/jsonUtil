const governanceAiTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiTestMaintainabilityBudgets = [
  governanceAiTestBudget('scripts/ci/maintainability-budget-governance-ai-test-rules.mjs', 20, 'AI 治理测试预算规则应独立维护治理测试文件和本规则表自身预算'),
  governanceAiTestBudget('scripts/ci/aiGovernanceAssetRegistry.test.mjs', 130, 'AI 治理资产注册表测试应独立维护登记结构和陈旧资产负例'),
  governanceAiTestBudget('scripts/ci/aiGovernanceAssetRegistryEvidence.test.mjs', 190, 'AI 治理资产注册表证据测试应独立维护证据认可、来源反查和正向来源匹配'),
  governanceAiTestBudget('scripts/ci/aiGovernanceAssetRegistrySemanticEvidence.test.mjs', 100, 'AI 治理资产注册表语义证据测试应独立维护自动发现资产不能只靠发现规则的负例'),
  governanceAiTestBudget('scripts/ci/aiGovernanceChecks.test.mjs', 1200, 'AI 治理主测试文件应显式纳入预算，新增场景优先评估按决策账本、CI 或引用规则契约拆分'),
  governanceAiTestBudget('scripts/ci/aiGovernanceSkillContract.test.mjs', 260, 'AI 治理 skill 契约测试应独立维护 skill 发现、frontmatter、章节和引用可达性负例'),
];
