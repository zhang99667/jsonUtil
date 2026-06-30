export const infraProductionAssetsIoMaintainabilityBudgets = [
  {
    file: 'scripts/ci/productionFrontendAssetExtras.mjs',
    maxLines: 45,
    reason: '公网前端额外旧资源列表解析应保持独立，避免污染 HTML/JS 路径提取逻辑',
  },
  {
    file: 'scripts/ci/productionFrontendAssetRequests.mjs',
    maxLines: 45,
    reason: '公网前端资源请求 helper 应只维护超时、文本拉取和 HEAD 可达性检查',
  },
  {
    file: 'scripts/ci/productionFrontendAssetMime.mjs',
    maxLines: 45,
    reason: '公网前端资源 MIME 校验应只维护 JS/CSS 类型白名单和 Content-Type 判定',
  },
];
