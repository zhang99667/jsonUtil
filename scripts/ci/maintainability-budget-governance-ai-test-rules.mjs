const governanceAiTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiTestMaintainabilityBudgets = [
  governanceAiTestBudget('scripts/ci/maintainability-budget-governance-ai-test-rules.mjs', 15, 'AI 治理测试预算规则应独立维护治理测试文件和本规则表自身预算'),
  governanceAiTestBudget('scripts/ci/aiGovernanceChecks.test.mjs', 1600, 'AI 治理主测试文件应显式纳入预算，新增场景优先评估按资产注册表、决策账本或 CI 契约拆分'),
];
