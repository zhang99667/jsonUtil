export const infraProductionAssetsCliMaintainabilityBudgets = [
  {
    file: 'scripts/ci/productionFrontendAssetCli.mjs',
    maxLines: 45,
    reason: '公网前端资源巡检 CLI helper 应只维护结果输出',
  },
  {
    file: 'scripts/ci/productionFrontendAssetCliArgs.mjs',
    maxLines: 50,
    reason: '公网前端资源巡检 CLI 参数解析应只维护入口 URL、输出选项和额外旧资源参数',
  },
];
