const governanceAiTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiTestMaintainabilityBudgets = [
  governanceAiTestBudget('scripts/ci/maintainability-budget-governance-ai-test-rules.mjs', 20, 'AI 治理测试预算规则应独立维护治理测试文件和本规则表自身预算'),
  governanceAiTestBudget('scripts/ci/aiGovernanceTestFixtures.mjs', 45, 'AI 治理测试 fixture 应独立维护临时目录和注册表表格构造，避免测试重复搭脚手架'),
  governanceAiTestBudget('scripts/ci/aiGovernanceAssetRegistry.test.mjs', 95, 'AI 治理资产注册表测试应独立维护登记结构必填和重复登记负例'),
  governanceAiTestBudget('scripts/ci/aiGovernanceAssetRegistryStaleEntries.test.mjs', 50, 'AI 治理资产注册表陈旧登记测试应独立维护已移除资产负例'),
  governanceAiTestBudget('scripts/ci/aiGovernanceAssetRegistryEvidence.test.mjs', 60, 'AI 治理资产注册表证据测试应独立维护证据认可和未知标记负例'),
  governanceAiTestBudget('scripts/ci/aiGovernanceAssetRegistryEvidenceSources.test.mjs', 135, 'AI 治理资产注册表证据来源测试应独立维护来源反查和正向来源匹配'),
  governanceAiTestBudget('scripts/ci/aiGovernanceAssetRegistrySemanticEvidence.test.mjs', 65, 'AI 治理资产注册表语义证据测试应独立维护自动发现资产不能只靠发现规则的负例'),
  governanceAiTestBudget('scripts/ci/aiGovernanceDecisionLedger.test.mjs', 170, 'AI 治理决策账本测试应独立维护结构、路径、CI 覆盖和日期顺序负例'),
  governanceAiTestBudget('scripts/ci/aiGovernanceMirroredEntryContract.test.mjs', 90, 'AI 治理同源入口契约测试应独立维护章节和共享片段漂移负例'),
  governanceAiTestBudget('scripts/ci/aiGovernanceReferenceRules.test.mjs', 220, 'AI 治理引用规则测试应独立维护入口、发布、安全和委派引用负例'),
  governanceAiTestBudget('scripts/ci/aiGovernanceSectionReferenceRules.test.mjs', 135, 'AI 治理章节引用规则测试应独立维护章节定位和代码块伪标题负例'),
  governanceAiTestBudget('scripts/ci/aiGovernanceChecks.test.mjs', 650, 'AI 治理主测试文件应显式纳入预算，新增场景优先评估按决策账本、CI 或引用规则契约拆分'),
  governanceAiTestBudget('scripts/ci/aiGovernanceSkillContract.test.mjs', 260, 'AI 治理 skill 契约测试应独立维护 skill 发现、frontmatter、章节和引用可达性负例'),
];
