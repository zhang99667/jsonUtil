export const infraProductionAssetsCliArgumentMaintainabilityBudgets = [
  {
    file: 'scripts/ci/productionFrontendAssetCliArgs.mjs',
    maxLines: 48,
    reason: '公网前端资源巡检 CLI 参数解析应只维护入口 URL、输出选项和额外旧资源合并',
  },
  {
    file: 'scripts/ci/productionFrontendAssetCliFlags.mjs',
    maxLines: 35,
    reason: '公网前端资源巡检 CLI flag helper 应只维护输出和额外旧资源 flag 语法',
  },
];
