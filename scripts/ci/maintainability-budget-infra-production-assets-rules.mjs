import { infraProductionAssetsCoreMaintainabilityBudgets } from './maintainability-budget-infra-production-assets-core-rules.mjs';
import { infraProductionAssetsSupportMaintainabilityBudgets } from './maintainability-budget-infra-production-assets-support-rules.mjs';

export const infraProductionAssetsMaintainabilityBudgets = [
  ...infraProductionAssetsCoreMaintainabilityBudgets,
  ...infraProductionAssetsSupportMaintainabilityBudgets,
];
