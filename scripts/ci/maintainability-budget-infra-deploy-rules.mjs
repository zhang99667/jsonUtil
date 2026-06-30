import { infraDeployCheckerMaintainabilityBudgets } from './maintainability-budget-infra-deploy-checker-rules.mjs';
import { infraDeployRuntimeMaintainabilityBudgets } from './maintainability-budget-infra-deploy-runtime-rules.mjs';

export const infraDeployMaintainabilityBudgets = [
  ...infraDeployCheckerMaintainabilityBudgets,
  ...infraDeployRuntimeMaintainabilityBudgets,
];
