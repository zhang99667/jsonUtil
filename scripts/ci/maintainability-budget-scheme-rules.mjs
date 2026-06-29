import { schemeCmdMaintainabilityBudgets } from './maintainability-budget-scheme-cmd-rules.mjs';
import { schemeCoreMaintainabilityBudgets } from './maintainability-budget-scheme-core-rules.mjs';
import { schemeSupportMaintainabilityBudgets } from './maintainability-budget-scheme-support-rules.mjs';

export const schemeMaintainabilityBudgets = [
  ...schemeCmdMaintainabilityBudgets,
  ...schemeCoreMaintainabilityBudgets,
  ...schemeSupportMaintainabilityBudgets,
];
