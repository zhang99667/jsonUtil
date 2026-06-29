export const schemeSupportQueryMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/schemeFragmentParams.ts',
    maxLines: 100,
    reason: 'Hash route 和 fragment 参数源识别应保持纯函数，避免挤回 Scheme 主流程',
  },
  {
    file: 'frontend/src/utils/schemeRawParams.ts',
    maxLines: 130,
    reason: '单个原始 query 参数识别应保持纯函数，服务深层解码和反向编码',
  },
  {
    file: 'frontend/src/utils/schemeFlatQueryParams.ts',
    maxLines: 70,
    reason: '扁平 query 参数聚合与重复 key 合并应独立于单参数识别规则',
  },
  {
    file: 'frontend/src/utils/schemeQueryDecoding.ts',
    maxLines: 40,
    reason: 'Scheme query 解码应集中处理表单加号和 URL Decode 失败兜底，避免回流核心解码流程',
  },
  {
    file: 'frontend/src/utils/schemePrefixedQuery.ts',
    maxLines: 60,
    reason: '带日志前缀的 query 参数串切分应保持纯函数，避免 Scheme 主流程和元信息导出规则漂移',
  },
  {
    file: 'frontend/src/utils/schemePlaceholders.ts',
    maxLines: 120,
    reason: '运行时占位符识别、收集和分组规则应保持集中、可审计',
  },
  {
    file: 'frontend/src/utils/structuredParamNames.ts',
    maxLines: 150,
    reason: '结构化 CMD 参数名白名单应保持集中、可审计',
  },
];
