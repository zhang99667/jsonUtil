export const transformSummaryDecodedMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportDecodedPaths.ts',
    maxLines: 145,
    reason: '深度解析 decoded 路径报告映射应保持纯函数模块，递归叶子遍历应留在独立 walker',
  },
  {
    file: 'frontend/src/utils/transformReportDecodedLeafWalker.ts',
    maxLines: 75,
    reason: '深度解析 decoded 叶子遍历应统一维护空数组、空对象和 JSONPath 拼接边界',
  },
  {
    file: 'frontend/src/utils/transformReportDecodedSearchData.ts',
    maxLines: 100,
    reason: '深度解析 decoded 搜索索引构建应保持纯函数模块，递归叶子遍历应留在独立 walker',
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
