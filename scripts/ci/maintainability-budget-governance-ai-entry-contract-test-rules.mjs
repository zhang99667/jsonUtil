const entryContractTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiEntryContractTestMaintainabilityBudgets = [
  entryContractTestBudget('scripts/ci/maintainability-budget-governance-ai-entry-contract-test-rules.mjs', 15, 'AI 治理入口契约测试预算子表应独立维护同源入口和工具薄入口测试预算'),
  entryContractTestBudget('scripts/ci/aiGovernanceMirroredEntryContract.test.mjs', 40, 'AI 治理同源入口契约测试应独立维护 AGENTS/CLAUDE 章节漂移负例'),
  entryContractTestBudget('scripts/ci/aiGovernanceMirroredEntryToolContract.test.mjs', 65, 'AI 治理工具薄入口契约测试应独立维护共享片段、权威来源和历史记录负例'),
  entryContractTestBudget('scripts/ci/aiGovernanceMirroredEntryTestFixtures.mjs', 45, 'AI 治理同源入口测试 fixture 应单源维护镜像章节、薄入口片段和权威来源锚点'),
];
