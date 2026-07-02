const schemeSupportQueryBudget = (file, maxLines, reason) => ({
  file: `frontend/src/utils/${file}`,
  maxLines,
  reason,
});

export const schemeSupportQueryMaintainabilityBudgets = [
  schemeSupportQueryBudget('schemeFragmentParams.ts', 100, 'Hash route 和 fragment 参数源识别应保持纯函数，避免挤回 Scheme 主流程'),
  schemeSupportQueryBudget('schemeFragmentParamSourceInfo.ts', 70, 'Fragment 参数源识别策略应保持显式顺序，避免 question/embedded/bare 分支语义漂移'),
  schemeSupportQueryBudget('schemeRawParams.ts', 95, '单个原始 query 参数识别应保持纯函数，服务深层解码和反向编码'),
  schemeSupportQueryBudget('schemeRawParams.test.ts', 80, '单个原始 query 参数测试只锁定结构化值、URL 值和 key 合法性边界'),
  schemeSupportQueryBudget('schemeFlatQueryParams.ts', 70, '扁平 query 参数聚合与重复 key 合并应独立于单参数识别规则'),
  schemeSupportQueryBudget('schemeQueryDecoding.ts', 40, 'Scheme query 解码应集中处理表单加号和 URL Decode 失败兜底，避免回流核心解码流程'),
  schemeSupportQueryBudget('schemePrefixedQuery.ts', 60, '带日志前缀的 query 参数串切分应保持纯函数，避免 Scheme 主流程和元信息导出规则漂移'),
  schemeSupportQueryBudget('schemePlaceholders.ts', 120, '运行时占位符识别、收集和分组规则应保持集中、可审计'),
  schemeSupportQueryBudget('structuredParamNames.ts', 150, '结构化 CMD 参数名白名单应保持集中、可审计'),
];
