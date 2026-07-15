const pairedTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiEvolutionPairedTestMaintainabilityBudgets = [
  pairedTestBudget('scripts/ci/maintainability-budget-governance-ai-evolution-paired-test-rules.mjs', 12, 'Paired evolution 测试预算子表只维护 fixture、verifier、writer 与 CLI 测试'),
  pairedTestBudget('scripts/ci/aiGovernanceEvolutionPairedReceiptV4TestFixtures.mjs', 210, 'Paired v4 测试 fixture 只构造当前实验、六 trace 与临时三角色 Ed25519 proof'),
  pairedTestBudget('scripts/ci/aiGovernanceEvolutionPairedReceiptV4.test.mjs', 180, 'Paired v4 测试应锁 candidate-only、infra 分层、proof 隔离、篡改与输入边界'),
  pairedTestBudget('scripts/ci/aiGovernanceEvolutionPairedReceiptV4Redteam.test.mjs', 180, 'Paired v4 红队锁 arm relabel、共享必读、baseline contamination、caller trust 过度声明与 batch replay'),
  pairedTestBudget('scripts/ci/aiGovernanceEvolutionPairedReceiptV4Integration.test.mjs', 130, 'Paired v4 集成测试锁 ledger reader、OutcomeEvidence 与 TraceOutcomes 的未授权分层'),
  pairedTestBudget('scripts/ci/aiGovernanceEvolutionPairedOutcomeWriter.test.mjs', 180, 'Paired writer 测试应锁 preview、零 orphan、CI 禁写与双 suffix 事务'),
  pairedTestBudget('scripts/ci/aiGovernanceEvolutionPairedOutcomeCli.test.mjs', 100, 'Paired CLI 测试应锁 strict args、help 零读取与零 caller trust 注入'),
];
