export const transformSummaryDecodedMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportDecodedPaths.ts',
    maxLines: 145,
    reason: '深度解析 decoded 路径报告映射应保持纯函数模块，递归叶子遍历应留在独立 walker',
  },
  { file: 'frontend/src/utils/transformReportDecodedLeafWalker.ts', maxLines: 75, reason: '深度解析 decoded 叶子遍历应统一维护迭代顺序、空容器和 JSONPath 拼接边界' },
  { file: 'frontend/src/utils/transformReportDecodedLeafWalker.test.ts', maxLines: 45, reason: '叶子遍历测试锁定万级深度、原顺序、空容器和提前停止语义' },
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
    file: 'frontend/src/utils/transformReportDecodedValue.test.ts',
    maxLines: 100,
    reason: '深度解析 decoded value 测试只锁定优先级、展示字段隔离和上下文不可变性',
  },
  {
    file: 'frontend/src/utils/transformReportJsonPath.ts',
    maxLines: 40,
    reason: '深度解析报告 JSONPath 拼接 helper 应保持小而稳定',
  },
];
