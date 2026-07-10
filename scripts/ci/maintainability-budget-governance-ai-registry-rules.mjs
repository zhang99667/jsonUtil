import { governanceAiRegistryCoreMaintainabilityBudgets } from './maintainability-budget-governance-ai-registry-core-rules.mjs';
import { governanceAiRegistryEvidenceMaintainabilityBudgets } from './maintainability-budget-governance-ai-registry-evidence-rules.mjs';
import { governanceAiRegistryFailureMaintainabilityBudgets } from './maintainability-budget-governance-ai-registry-failure-rules.mjs';
export const governanceAiRegistryMaintainabilityBudgets = [
  ...governanceAiRegistryCoreMaintainabilityBudgets,
  ...governanceAiRegistryEvidenceMaintainabilityBudgets,
  ...governanceAiRegistryFailureMaintainabilityBudgets,
];
