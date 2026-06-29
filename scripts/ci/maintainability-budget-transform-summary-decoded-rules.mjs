export const transformSummaryDecodedMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportDecodedPaths.ts',
    maxLines: 180,
    reason: '深度解析 decoded 路径收集应保持纯函数模块，搜索索引逻辑应留在独立模块',
  },
  {
    file: 'frontend/src/utils/transformReportDecodedSearchData.ts',
    maxLines: 140,
    reason: '深度解析 decoded 搜索索引构建应保持纯函数模块，避免回流到路径复制模块',
  },
  {
    file: 'frontend/src/utils/transformReportDecodedValue.ts',
    maxLines: 65,
    reason: '深度解析 decoded value 和 preview 提取应保持独立纯函数，避免回流到报告聚合文件',
  },
  {
    file: 'frontend/src/utils/transformReportJsonPath.ts',
    maxLines: 40,
    reason: '深度解析报告 JSONPath 拼接 helper 应保持小而稳定',
  },
];
