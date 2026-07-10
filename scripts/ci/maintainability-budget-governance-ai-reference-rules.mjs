import { governanceAiReferenceEntryMaintainabilityBudgets } from './maintainability-budget-governance-ai-reference-entry-rules.mjs';
import { governanceAiReferenceGroupMaintainabilityBudgets } from './maintainability-budget-governance-ai-reference-group-rules.mjs';
const governanceAiReferenceBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiReferenceMaintainabilityBudgets = [
  governanceAiReferenceBudget('scripts/ci/maintainability-budget-governance-ai-reference-rules.mjs', 15, 'AI 治理引用预算父表应只组合引用入口和引用组预算'),
  ...governanceAiReferenceEntryMaintainabilityBudgets,
  ...governanceAiReferenceGroupMaintainabilityBudgets,
];
