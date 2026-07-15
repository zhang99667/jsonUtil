const pairedBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiEvolutionPairedMaintainabilityBudgets = [
  pairedBudget('scripts/ci/maintainability-budget-governance-ai-evolution-paired-rules.mjs', 12, 'Paired evolution 预算子表只维护 v4 proof、verifier、writer、CLI 与必需资产'),
  pairedBudget('scripts/ci/aiGovernanceEvolutionPairedReceiptV4Proof.mjs', 260, 'Paired v4 proof 只维护域分离 commitment、assignment/checkpoint/final DSSE 与未见证状态'),
  pairedBudget('scripts/ci/aiGovernanceEvolutionPairedReceiptV4Assignment.mjs', 110, 'Paired v4 assignment 只维护 pre-execution arm/treatment/alias/lease/task 绑定与 baseline withheld 校验'),
  pairedBudget('scripts/ci/aiGovernanceEvolutionPairedReceiptV4.mjs', 500, 'Paired v4 verifier 应只维护闭字段六 trial、trace/treatment、基础设施与 candidate-only reducer'),
  pairedBudget('scripts/ci/aiGovernanceEvolutionPairedOutcomeWriter.mjs', 480, 'Paired outcome writer 应只维护 preview、仓库派生字段、双 ledger 候选与共享事务提交'),
  pairedBudget('scripts/ci/record-ai-evolution-paired-outcome.mjs', 120, 'Paired outcome CLI 应只维护 bounded stdin、preview-first 参数与零 caller trust key'),
  pairedBudget('scripts/ci/aiGovernanceRequiredEvolutionPairedFiles.mjs', 20, 'Paired evolution 必需资产子表应完整登记 verifier、writer、CLI 与测试'),
];
