import { appRecoveryRuntimeMaintainabilityBudgets } from './maintainability-budget-app-recovery-runtime-rules.mjs';
import { appRecoveryUpdateMaintainabilityBudgets } from './maintainability-budget-app-recovery-update-rules.mjs';

export const appRecoveryMaintainabilityBudgets = [
  ...appRecoveryRuntimeMaintainabilityBudgets,
  ...appRecoveryUpdateMaintainabilityBudgets,
];
