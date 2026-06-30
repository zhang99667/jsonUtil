import { infraProductionAssetsPathMaintainabilityBudgets } from './maintainability-budget-infra-production-assets-path-rules.mjs';

export const infraProductionAssetsCoreMaintainabilityBudgets = [
  {
    file: 'scripts/ci/check-production-frontend-assets.mjs',
    maxLines: 45,
    reason: '公网前端资源巡检 CLI 应只保留参数、输出和退出码，递归扫描逻辑放在独立 audit 模块',
  },
  {
    file: 'scripts/ci/productionFrontendAssetAudit.mjs',
    maxLines: 95,
    reason: '公网前端资源巡检核心应聚焦递归扫描和结果组装，不承载 CLI 输出、路径解析或 HTTP 细节',
  },
  ...infraProductionAssetsPathMaintainabilityBudgets,
];
