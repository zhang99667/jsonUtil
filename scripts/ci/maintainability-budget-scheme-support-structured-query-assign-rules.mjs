export const schemeSupportStructuredQueryAssignMaintainabilityBudgets = [
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
];
