import { appMaintainabilityBudgets } from './maintainability-budget-app-rules.mjs';
import { schemeMaintainabilityBudgets } from './maintainability-budget-scheme-rules.mjs';

export const schemeAppMaintainabilityBudgets = [
  ...schemeMaintainabilityBudgets,
  ...appMaintainabilityBudgets,
];
