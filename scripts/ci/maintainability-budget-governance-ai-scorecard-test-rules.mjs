const governanceAiScorecardTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiScorecardTestMaintainabilityBudgets = [
  governanceAiScorecardTestBudget('scripts/ci/maintainability-budget-governance-ai-scorecard-test-rules.mjs', 15, 'AI 治理成熟度 scorecard 测试预算子表应独立维护焦点、状态和兜底契约测试预算'),
  governanceAiScorecardTestBudget('scripts/ci/aiGovernanceMaturityScorecard.test.mjs', 65, 'AI 治理成熟度 scorecard 焦点测试应独立维护行为评测、预算热点和 AI 基建优先级断言'),
  governanceAiScorecardTestBudget('scripts/ci/aiGovernanceMaturityScorecardDetails.test.mjs', 35, 'AI 治理成熟度 scorecard details 测试应独立锁定维护热点结构化摘要'),
  governanceAiScorecardTestBudget('scripts/ci/aiGovernanceMaturityScorecardEvolution.test.mjs', 110, 'AI 治理成熟度 scorecard 行为评测测试应区分无证据 unknown、trace-bound warn 与 verified pass'),
  governanceAiScorecardTestBudget('scripts/ci/aiGovernanceMaturityScorecardStatusContract.test.mjs', 80, 'AI 治理成熟度 scorecard 状态测试应独立维护严重度优先、fail-closed 和 unknown 兜底断言'),
];
