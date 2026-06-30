export const infraProductionAssetsJavascriptPathMaintainabilityBudgets = [
  {
    file: 'scripts/ci/productionFrontendAssetJavascriptPaths.mjs',
    maxLines: 20,
    reason: '公网前端 JS 资源发现入口应只组合 JS 候选提取和候选路径解析',
  },
  {
    file: 'scripts/ci/productionFrontendAssetJavascriptPathResolvers.mjs',
    maxLines: 40,
    reason: '公网前端 JS 候选路径解析应集中维护三类候选归一化、文档示例过滤和去重顺序',
  },
  {
    file: 'scripts/ci/productionFrontendAssetJavascriptCandidates.mjs',
    maxLines: 35,
    reason: '公网前端 JS 资源候选提取应集中维护字符串、相对路径和 import.meta.url 识别模式',
  },
];
