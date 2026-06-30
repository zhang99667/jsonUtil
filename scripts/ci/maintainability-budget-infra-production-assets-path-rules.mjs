import { infraProductionAssetsJavascriptPathMaintainabilityBudgets } from './maintainability-budget-infra-production-assets-javascript-path-rules.mjs';

export const infraProductionAssetsPathMaintainabilityBudgets = [
  {
    file: 'scripts/ci/productionFrontendAssetPaths.mjs',
    maxLines: 35,
    reason: '公网前端资源路径入口应只保留 HTML 提取、页面配置和 JS 提取兼容导出',
  },
  ...infraProductionAssetsJavascriptPathMaintainabilityBudgets,
  {
    file: 'scripts/ci/productionFrontendAssetPathNormalization.mjs',
    maxLines: 40,
    reason: '公网前端资源路径归一化应集中维护 baseUrl、asset path 和 JS asset 类型判断',
  },
];
