import { appRecoveryUpdateCoreMaintainabilityBudgets } from './maintainability-budget-app-recovery-update-core-rules.mjs';
import { appRecoveryUpdateScheduleMaintainabilityBudgets } from './maintainability-budget-app-recovery-update-schedule-rules.mjs';

export const appRecoveryUpdateMaintainabilityBudgets = [
  ...appRecoveryUpdateCoreMaintainabilityBudgets,
  ...appRecoveryUpdateScheduleMaintainabilityBudgets,
];
