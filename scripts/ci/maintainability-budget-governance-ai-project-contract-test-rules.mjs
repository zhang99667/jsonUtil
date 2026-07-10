const projectContractTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiProjectContractTestMaintainabilityBudgets = [
  projectContractTestBudget('scripts/ci/maintainability-budget-governance-ai-project-contract-test-rules.mjs', 15, 'AI 治理项目事实契约测试预算子表应只维护项目事实和版本事实测试条目'),
  projectContractTestBudget('scripts/ci/aiGovernanceProjectFactsContract.test.mjs', 70, 'AI 治理项目事实契约测试应独立维护数据库事实漂移负例'),
  projectContractTestBudget('scripts/ci/aiGovernanceProjectDatabaseFactTestFixtures.mjs', 20, 'AI 治理项目数据库事实测试 fixture 应独立维护 PostgreSQL 来源和入口目标写入'),
  projectContractTestBudget('scripts/ci/aiGovernanceProjectVersionFactsContract.test.mjs', 125, 'AI 治理项目版本事实契约测试应独立维护前后端版本和 lock 漂移负例'),
];
