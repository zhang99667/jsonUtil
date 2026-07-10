import { governanceAiDecisionLedgerMaintainabilityBudgets } from './maintainability-budget-governance-ai-decision-ledger-rules.mjs';
import { governanceAiDecisionReferenceMaintainabilityBudgets } from './maintainability-budget-governance-ai-decision-reference-rules.mjs';
const governanceAiDecisionBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiDecisionMaintainabilityBudgets = [
  governanceAiDecisionBudget('scripts/ci/maintainability-budget-governance-ai-decision-rules.mjs', 15, 'AI 治理决策账本预算父表应只组合账本契约和账本引用预算子表'),
  ...governanceAiDecisionLedgerMaintainabilityBudgets,
  ...governanceAiDecisionReferenceMaintainabilityBudgets,
];
