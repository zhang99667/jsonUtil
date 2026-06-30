export const schemeSupportStructuredQuerySerializeMaintainabilityBudgets = [
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
];
