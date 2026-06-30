export const infraProductionAssetsQueueMaintainabilityBudgets = [
  {
    file: 'scripts/ci/productionFrontendAssetDiscoveryQueue.mjs',
    maxLines: 30,
    reason: '公网前端资源发现队列应只维护去重入队和 JS/CSS 待扫描分类',
  },
];
