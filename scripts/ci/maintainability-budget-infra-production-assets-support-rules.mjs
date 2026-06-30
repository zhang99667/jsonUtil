import { infraProductionAssetsCliMaintainabilityBudgets } from './maintainability-budget-infra-production-assets-cli-rules.mjs';
import { infraProductionAssetsIoMaintainabilityBudgets } from './maintainability-budget-infra-production-assets-io-rules.mjs';
import { infraProductionAssetsQueueMaintainabilityBudgets } from './maintainability-budget-infra-production-assets-queue-rules.mjs';
import { infraProductionAssetsScannerMaintainabilityBudgets } from './maintainability-budget-infra-production-assets-scanner-rules.mjs';

export const infraProductionAssetsSupportMaintainabilityBudgets = [
  ...infraProductionAssetsCliMaintainabilityBudgets,
  ...infraProductionAssetsIoMaintainabilityBudgets,
  ...infraProductionAssetsQueueMaintainabilityBudgets,
  ...infraProductionAssetsScannerMaintainabilityBudgets,
];
