import { adminAuthMaintainabilityBudgets } from './maintainability-budget-admin-auth-rules.mjs';
import { adminFileManagementMaintainabilityBudgets } from './maintainability-budget-admin-file-management-rules.mjs';
import { adminTrafficMaintainabilityBudgets } from './maintainability-budget-admin-traffic-rules.mjs';
import { adminUserManagementMaintainabilityBudgets } from './maintainability-budget-admin-user-management-rules.mjs';
import { backendFileManagementMaintainabilityBudgets } from './maintainability-budget-backend-file-management-rules.mjs';
import { backendReportingMaintainabilityBudgets } from './maintainability-budget-backend-reporting-rules.mjs';
import { backendRequestBoundaryMaintainabilityBudgets } from './maintainability-budget-backend-request-boundary-rules.mjs';
import { backendResponseMaintainabilityBudgets } from './maintainability-budget-backend-response-rules.mjs';
import { backendTrafficMaintainabilityBudgets } from './maintainability-budget-backend-traffic-rules.mjs';
import { governanceMaintainabilityBudgets } from './maintainability-budget-governance-rules.mjs';
import { infraMaintainabilityBudgets } from './maintainability-budget-infra-rules.mjs';
import { schemeAppMaintainabilityBudgets } from './maintainability-budget-scheme-app-rules.mjs';
import { transformMaintainabilityBudgets } from './maintainability-budget-transform-rules.mjs';

export const maintainabilityBudgets = [
  ...adminAuthMaintainabilityBudgets,
  ...adminFileManagementMaintainabilityBudgets,
  ...adminTrafficMaintainabilityBudgets,
  ...adminUserManagementMaintainabilityBudgets,
  ...backendFileManagementMaintainabilityBudgets,
  ...backendReportingMaintainabilityBudgets,
  ...backendRequestBoundaryMaintainabilityBudgets,
  ...backendResponseMaintainabilityBudgets,
  ...backendTrafficMaintainabilityBudgets,
  ...transformMaintainabilityBudgets,
  ...schemeAppMaintainabilityBudgets,
  ...infraMaintainabilityBudgets,
  ...governanceMaintainabilityBudgets,
];
