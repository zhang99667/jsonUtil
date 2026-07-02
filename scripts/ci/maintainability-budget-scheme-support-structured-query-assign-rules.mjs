export const schemeSupportStructuredQueryAssignMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/schemeStructuredQueryAssign.ts',
    maxLines: 80,
    reason: '结构化 Query 赋值入口应只负责 key 解析与普通 key 合并',
  },
  {
    file: 'frontend/src/utils/schemeStructuredQueryAssignPath.ts',
    maxLines: 45,
    reason: '结构化 Query 嵌套路径遍历应只负责段循环和叶子赋值，游标推进继续放在专用 helper',
  },
  {
    file: 'frontend/src/utils/schemeStructuredQueryAssignPathCursor.ts',
    maxLines: 55,
    reason: '结构化 Query 路径游标 helper 应只维护数组追加、索引数组和对象 key 三类中间段推进',
  },
  {
    file: 'frontend/src/utils/schemeStructuredQueryAssignNodes.ts',
    maxLines: 70,
    reason: '结构化 Query 叶子合并和嵌套容器创建规则应保持独立纯函数模块',
  },
];
