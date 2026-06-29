export const schemeSupportBase64SuffixMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/schemeBase64SuffixMeta.ts',
    maxLines: 60,
    reason: '真实广告 extraParam 后缀元信息注入应独立于后缀 query 扫描',
  },
  {
    file: 'frontend/src/utils/schemeBase64SuffixQuery.ts',
    maxLines: 70,
    reason: '真实广告 extraParam 后缀 Base64 query 扫描应独立于 JSON 元信息注入',
  },
];
