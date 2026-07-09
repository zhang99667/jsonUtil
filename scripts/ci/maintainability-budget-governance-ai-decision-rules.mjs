const governanceAiDecisionBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiDecisionMaintainabilityBudgets = [
  governanceAiDecisionBudget('scripts/ci/maintainability-budget-governance-ai-decision-rules.mjs', 15, 'AI 治理决策账本预算规则应独立维护决策账本检查和引用 helper 预算'),
  governanceAiDecisionBudget('scripts/ci/aiGovernanceDecisionLedger.mjs', 35, 'AI 治理决策账本入口应只组合文件读取、表格解析、日期顺序和行级校验'),
  governanceAiDecisionBudget('scripts/ci/aiGovernanceDecisionLedgerRowContract.mjs', 60, 'AI 治理决策账本行级契约应独立维护弱占位、回写契约和锁定测试校验'),
  governanceAiDecisionBudget('scripts/ci/aiGovernanceDecisionLedgerBackfillContract.mjs', 25, 'AI 治理决策账本回写契约应独立维护账本自追踪、CHANGELOG 和路径存在性校验'),
  governanceAiDecisionBudget('scripts/ci/aiGovernanceDecisionLedgerTestEvidence.mjs', 20, 'AI 治理决策账本测试证据 helper 应独立维护锁定测试文件的活跃用例校验'),
  governanceAiDecisionBudget('scripts/ci/aiGovernanceDecisionLedgerTable.mjs', 35, 'AI 治理决策账本表格解析应独立维护目标表头、分隔行和决策记录抽取'),
  governanceAiDecisionBudget('scripts/ci/aiGovernanceDecisionLedgerReferences.mjs', 20, 'AI 治理决策账本引用 helper 应独立维护反引号路径和命令解析'),
  governanceAiDecisionBudget('scripts/ci/aiGovernanceDecisionReferenceRule.mjs', 15, 'AI 治理决策账本引用规则应独立维护账本自身的关键引用'),
];
