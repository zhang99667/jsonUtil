export const schemeSupportStructuredQueryMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/schemeStructuredQuery.ts',
    maxLines: 40,
    reason: '结构化 Query 公开入口应只保留兼容导出，回写和赋值逻辑留在专用 helper',
  },
  {
    file: 'frontend/src/utils/schemeStructuredQuerySerializer.ts',
    maxLines: 80,
    reason: '结构化 Query 序列化应保持纯函数模块，原始风格采集留在 styles helper',
  },
  {
    file: 'frontend/src/utils/schemeStructuredQueryStyles.ts',
    maxLines: 60,
    reason: '结构化 Query 原始 dot/bracket/空数组风格采集应独立于序列化递归',
  },
  {
    file: 'frontend/src/utils/schemeStructuredQueryValues.ts',
    maxLines: 40,
    reason: '结构化 Query 值判断和字符串化应保持独立小函数，服务 Scheme 回写主流程',
  },
  {
    file: 'frontend/src/utils/schemeStructuredQueryAssign.ts',
    maxLines: 80,
    reason: '结构化 Query 赋值入口应只负责 key 解析与普通 key 合并',
  },
  {
    file: 'frontend/src/utils/schemeStructuredQueryAssignPath.ts',
    maxLines: 60,
    reason: '结构化 Query 嵌套路径遍历应独立于公开赋值入口和叶子合并规则',
  },
  {
    file: 'frontend/src/utils/schemeStructuredQueryAssignNodes.ts',
    maxLines: 70,
    reason: '结构化 Query 叶子合并和嵌套容器创建规则应保持独立纯函数模块',
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
