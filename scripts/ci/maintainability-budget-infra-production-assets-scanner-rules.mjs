const scannerBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const infraProductionAssetsScannerMaintainabilityBudgets = [
  scannerBudget('scripts/ci/productionFrontendAssetCssPaths.mjs', 30, '公网前端 CSS 资源提取应只维护 url()/@import 扫描和注释过滤'),
  scannerBudget('scripts/ci/productionFrontendAssetCssNormalization.mjs', 30, '公网前端 CSS 资源归一化应集中维护相对资源和同站 asset path 判断'),
  scannerBudget('scripts/ci/productionFrontendAssetScanners.mjs', 70, '公网前端资源扫描器应只维护 JS/CSS 队列消费、递归发现和失败收集'),
];
