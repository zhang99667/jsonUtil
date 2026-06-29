export const schemeSupportQuerySyntaxMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/schemeQuerySyntax.ts',
    maxLines: 40,
    reason: 'Query 语法入口应只做兼容导出，pattern、归一化和 pair 拆分留在专用模块',
  },
  {
    file: 'frontend/src/utils/schemeQueryPatterns.ts',
    maxLines: 40,
    reason: 'Query key/pair pattern 常量应保持集中、可复用',
  },
  {
    file: 'frontend/src/utils/schemeQueryNormalization.ts',
    maxLines: 80,
    reason: 'Query 语法归一化和前缀剥离应保持纯函数小模块',
  },
  {
    file: 'frontend/src/utils/schemeQueryPairs.ts',
    maxLines: 80,
    reason: 'Query pair 拆分应只负责分隔符扫描，原始 JSON 值边界留在专用模块',
  },
  {
    file: 'frontend/src/utils/schemeQueryRawJson.ts',
    maxLines: 80,
    reason: 'Query 原始 JSON 值边界扫描应保持独立纯函数，避免 pair 拆分逻辑膨胀',
  },
];
