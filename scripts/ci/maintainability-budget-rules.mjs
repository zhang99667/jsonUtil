import { governanceMaintainabilityBudgets } from './maintainability-budget-governance-rules.mjs';
import { infraMaintainabilityBudgets } from './maintainability-budget-infra-rules.mjs';
import { schemeAppMaintainabilityBudgets } from './maintainability-budget-scheme-app-rules.mjs';
import { transformMaintainabilityBudgets } from './maintainability-budget-transform-rules.mjs';

export const maintainabilityBudgets = [
  ...transformMaintainabilityBudgets,
  ...schemeAppMaintainabilityBudgets,
  ...infraMaintainabilityBudgets,
  ...governanceMaintainabilityBudgets,
];
