const governanceAiDecisionLedgerBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiDecisionLedgerMaintainabilityBudgets = [
  governanceAiDecisionLedgerBudget('scripts/ci/maintainability-budget-governance-ai-decision-ledger-rules.mjs', 15, 'AI 治理决策账本预算子表应独立维护账本入口、行级契约和表格解析预算'),
  governanceAiDecisionLedgerBudget('scripts/ci/aiGovernanceDecisionLedger.mjs', 35, 'AI 治理决策账本入口应只组合文件读取、表格解析、日期顺序和行级校验'),
  governanceAiDecisionLedgerBudget('scripts/ci/aiGovernanceDecisionLedgerRowContract.mjs', 60, 'AI 治理决策账本行级契约应独立维护弱占位、回写契约和锁定测试校验'),
  governanceAiDecisionLedgerBudget('scripts/ci/aiGovernanceDecisionLedgerBackfillContract.mjs', 25, 'AI 治理决策账本回写契约应独立维护账本自追踪、CHANGELOG 和路径存在性校验'),
  governanceAiDecisionLedgerBudget('scripts/ci/aiGovernanceDecisionLedgerTestEvidence.mjs', 20, 'AI 治理决策账本测试证据 helper 应独立维护锁定测试文件的活跃用例校验'),
  governanceAiDecisionLedgerBudget('scripts/ci/aiGovernanceDecisionLedgerActiveTestContent.mjs', 20, 'AI 治理决策账本活跃测试内容 helper 应独立维护 test/it 与 only 声明识别'),
  governanceAiDecisionLedgerBudget('scripts/ci/aiGovernanceDecisionLedgerTable.mjs', 35, 'AI 治理决策账本表格解析应独立维护目标表头、分隔行和决策记录抽取'),
  governanceAiDecisionLedgerBudget('scripts/ci/aiGovernanceMarkdownTableRows.mjs', 40, 'AI 治理 Markdown 表格行解析 helper 应独立维护命名表格的表头、分隔行和行对象抽取'),
];
