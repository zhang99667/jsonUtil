import { schemeCmdCandidateMaintainabilityBudgets } from './maintainability-budget-scheme-cmd-candidate-rules.mjs';
import { schemeCmdDiffMaintainabilityBudgets } from './maintainability-budget-scheme-cmd-diff-rules.mjs';

export const schemeCmdMaintainabilityBudgets = [
  ...schemeCmdDiffMaintainabilityBudgets,
  ...schemeCmdCandidateMaintainabilityBudgets,
];
