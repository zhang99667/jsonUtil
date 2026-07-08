import { governanceAiContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-contract-rules.mjs';
import { governanceAiCoreMaintainabilityBudgets } from './maintainability-budget-governance-ai-core-rules.mjs';
import { governanceAiDecisionMaintainabilityBudgets } from './maintainability-budget-governance-ai-decision-rules.mjs';
import { governanceAiReferenceMaintainabilityBudgets } from './maintainability-budget-governance-ai-reference-rules.mjs';
import { governanceAiRegistryMaintainabilityBudgets } from './maintainability-budget-governance-ai-registry-rules.mjs';
import { governanceAiTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-test-rules.mjs';

export const governanceAiMaintainabilityBudgets = [
  ...governanceAiCoreMaintainabilityBudgets,
  ...governanceAiRegistryMaintainabilityBudgets,
  ...governanceAiContractMaintainabilityBudgets,
  ...governanceAiDecisionMaintainabilityBudgets,
  ...governanceAiTestMaintainabilityBudgets,
  ...governanceAiReferenceMaintainabilityBudgets,
];
