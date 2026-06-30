export const infraProductionAssetsPathMaintainabilityBudgets = [
  {
    file: 'scripts/ci/productionFrontendAssetPaths.mjs',
    maxLines: 35,
    reason: '公网前端资源路径入口应只保留 HTML 提取、页面配置和 JS 提取兼容导出',
  },
  {
    file: 'scripts/ci/productionFrontendAssetJavascriptPaths.mjs',
    maxLines: 35,
    reason: '公网前端 JS 资源发现应只维护 assets 字符串、相对 import 和 import.meta.url 提取',
  },
  {
    file: 'scripts/ci/productionFrontendAssetJavascriptCandidates.mjs',
    maxLines: 35,
    reason: '公网前端 JS 资源候选提取应集中维护字符串、相对路径和 import.meta.url 识别模式',
  },
  {
    file: 'scripts/ci/productionFrontendAssetPathNormalization.mjs',
    maxLines: 40,
    reason: '公网前端资源路径归一化应集中维护 baseUrl、asset path 和 JS asset 类型判断',
  },
];
