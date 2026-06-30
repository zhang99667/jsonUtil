import { governanceAppMaintainabilityBudgets } from './maintainability-budget-governance-app-rules.mjs';
import { governanceCheckerMaintainabilityBudgets } from './maintainability-budget-governance-checker-rules.mjs';
import { governanceInfraMaintainabilityBudgets } from './maintainability-budget-governance-infra-rules.mjs';
import { governanceSchemeAppMaintainabilityBudgets } from './maintainability-budget-governance-scheme-app-rules.mjs';
import { governanceSelfMaintainabilityBudgets } from './maintainability-budget-governance-self-rules.mjs';
import { governanceTransformMaintainabilityBudgets } from './maintainability-budget-governance-transform-rules.mjs';

export const governanceMaintainabilityBudgets = [
  ...governanceCheckerMaintainabilityBudgets,
  ...governanceInfraMaintainabilityBudgets,
  ...governanceTransformMaintainabilityBudgets,
  ...governanceSchemeAppMaintainabilityBudgets,
  ...governanceAppMaintainabilityBudgets,
  ...governanceSelfMaintainabilityBudgets,
];
