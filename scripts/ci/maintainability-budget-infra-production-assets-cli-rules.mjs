import { infraProductionAssetsCliArgumentMaintainabilityBudgets } from './maintainability-budget-infra-production-assets-cli-argument-rules.mjs';

export const infraProductionAssetsCliMaintainabilityBudgets = [
  {
    file: 'scripts/ci/productionFrontendAssetCli.mjs',
    maxLines: 45,
    reason: '公网前端资源巡检 CLI helper 应只维护结果输出',
  },
  ...infraProductionAssetsCliArgumentMaintainabilityBudgets,
];
