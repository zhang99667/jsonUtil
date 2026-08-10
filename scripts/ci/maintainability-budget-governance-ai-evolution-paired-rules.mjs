const pairedBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiEvolutionPairedMaintainabilityBudgets = [
  pairedBudget('scripts/ci/maintainability-budget-governance-ai-evolution-paired-rules.mjs', 16, 'Paired evolution 预算子表只维护 v4 commitment、proof、verifier、candidate、writer、CLI 与必需资产'),
  pairedBudget('scripts/ci/aiGovernanceEvolutionPairedReceiptV4Commitments.mjs', 160, 'Paired v4 commitment 只维护域分离 hash 与 assignment/checkpoint/final Statement 构造'),
  pairedBudget('scripts/ci/aiGovernanceEvolutionPairedReceiptV4Proof.mjs', 120, 'Paired v4 proof 只维护三角色 DSSE 验证、keyid/SPKI 隔离与未见证状态'),
  pairedBudget('scripts/ci/aiGovernanceEvolutionPairedReceiptV4Assignment.mjs', 110, 'Paired v4 assignment 只维护 pre-execution arm/treatment/alias/lease/task 绑定与 baseline withheld 校验'),
  pairedBudget('scripts/ci/aiGovernanceEvolutionPairedReceiptV4.mjs', 500, 'Paired v4 verifier 应只维护闭字段六 trial、trace/treatment、基础设施与 candidate-only reducer'),
  pairedBudget('scripts/ci/aiGovernanceEvolutionPairedOutcomeCandidate.mjs', 200, 'Paired outcome candidate 应只从已验证 batch、当前 revision 与双 ledger 尾部派生 receipt/outcome suffix'),
  pairedBudget('scripts/ci/aiGovernanceEvolutionPairedOutcomeWriter.mjs', 420, 'Paired outcome writer 应只维护 preview、ledger 稳定性、候选校验与共享事务提交'),
  pairedBudget('scripts/ci/record-ai-evolution-paired-outcome.mjs', 120, 'Paired outcome CLI 应只维护 bounded stdin、preview-first 参数与零 caller trust key'),
  pairedBudget('scripts/ci/aiGovernanceRequiredEvolutionPairedFiles.mjs', 24, 'Paired evolution 必需资产子表应完整登记 verifier、candidate、writer、CLI 与测试'),
];
