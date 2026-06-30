export const infraProductionAssetsScannerMaintainabilityBudgets = [
  {
    file: 'scripts/ci/productionFrontendAssetCssPaths.mjs',
    maxLines: 30,
    reason: '公网前端 CSS 资源提取应只维护 url()/@import 扫描和注释过滤',
  },
  {
    file: 'scripts/ci/productionFrontendAssetCssNormalization.mjs',
    maxLines: 30,
    reason: '公网前端 CSS 资源归一化应集中维护相对资源和同站 asset path 判断',
  },
  {
    file: 'scripts/ci/productionFrontendAssetScanners.mjs',
    maxLines: 70,
    reason: '公网前端资源扫描器应只维护 JS/CSS 队列消费、递归发现和失败收集',
  },
];
