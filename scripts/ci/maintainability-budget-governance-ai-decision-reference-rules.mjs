const governanceAiDecisionReferenceBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiDecisionReferenceMaintainabilityBudgets = [
  governanceAiDecisionReferenceBudget('scripts/ci/maintainability-budget-governance-ai-decision-reference-rules.mjs', 15, 'AI 治理决策账本引用预算子表应独立维护引用 helper、命令引用和账本引用规则预算'),
  governanceAiDecisionReferenceBudget('scripts/ci/aiGovernanceDecisionLedgerReferences.mjs', 10, 'AI 治理决策账本引用 helper 应只维护 Markdown 反引号内容提取'),
  governanceAiDecisionReferenceBudget('scripts/ci/aiGovernanceDecisionLedgerCommandReferences.mjs', 30, 'AI 治理决策账本命令引用 helper 应独立维护可执行命令、node 路径和 CI 覆盖识别'),
  governanceAiDecisionReferenceBudget('scripts/ci/aiGovernanceDecisionReferenceRule.mjs', 15, 'AI 治理决策账本引用规则应独立维护账本自身的关键引用'),
];
