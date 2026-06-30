export const schemeSupportStructuredQueryParseMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/schemeStructuredQuery.ts',
    maxLines: 40,
    reason: '结构化 Query 公开入口应只保留兼容导出，回写和赋值逻辑留在专用 helper',
  },
  {
    file: 'frontend/src/utils/schemeStructuredQueryKeys.ts',
    maxLines: 70,
    reason: '结构化 Query key 解析应保持纯函数小模块',
  },
  {
    file: 'frontend/src/utils/schemeStructuredQueryTypes.ts',
    maxLines: 40,
    reason: '结构化 Query 类型应保持稳定、集中导出',
  },
];
