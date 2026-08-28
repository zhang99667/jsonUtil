const decisionLedgerTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiDecisionTestMaintainabilityBudgets = [
  decisionLedgerTestBudget('scripts/ci/maintainability-budget-governance-ai-decision-test-rules.mjs', 15, 'AI 治理决策账本测试预算子表应独立维护账本结构、命令契约和测试证据预算'),
  decisionLedgerTestBudget('scripts/ci/aiGovernanceDecisionLedger.test.mjs', 115, 'AI 治理决策账本测试应独立维护结构、回写路径和日期顺序负例'),
  decisionLedgerTestBudget('scripts/ci/aiGovernanceDecisionLedgerBackfillContract.test.mjs', 70, 'AI 治理决策账本回写路径测试应独立锁定 canonical、越界、symlink 和真实缺失边界'),
  decisionLedgerTestBudget('scripts/ci/aiGovernanceDecisionLedgerTestCommandContract.test.mjs', 105, 'AI 治理决策账本锁定测试命令测试应独立维护路径、CI 和 MCP 覆盖负例'),
  decisionLedgerTestBudget('scripts/ci/aiGovernanceDecisionLedgerTestFixtures.mjs', 35, 'AI 治理决策账本测试 fixture 应单源维护账本内容和回写文件脚手架'),
  decisionLedgerTestBudget('scripts/ci/aiGovernanceDecisionLedgerTestEvidence.test.mjs', 40, 'AI 治理决策账本测试证据用例应复用账本 fixture 并独立维护活跃测试和 only 负例'),
];
