export const governanceSchemeStructuredQueryMaintainabilityBudgets = [
  { file: 'scripts/ci/maintainability-budget-scheme-support-structured-query-rules.mjs', maxLines: 15, reason: 'Scheme 结构化 Query 预算入口应只组合 parse、assign 和 serialize 子表' },
  { file: 'scripts/ci/maintainability-budget-scheme-support-structured-query-parse-rules.mjs', maxLines: 25, reason: 'Scheme 结构化 Query 解析预算规则应只维护公开入口、key 和类型契约' },
  { file: 'scripts/ci/maintainability-budget-scheme-support-structured-query-assign-rules.mjs', maxLines: 35, reason: 'Scheme 结构化 Query 赋值预算规则应只维护赋值入口、路径遍历、路径游标和节点合并条目' },
  { file: 'scripts/ci/maintainability-budget-scheme-support-structured-query-serialize-rules.mjs', maxLines: 25, reason: 'Scheme 结构化 Query 序列化预算规则应只维护 serializer、style 和 value helper 条目' },
  { file: 'scripts/ci/maintainability-budget-governance-scheme-structured-query-rules.mjs', maxLines: 15, reason: 'Scheme 结构化 Query 治理预算规则应只维护结构化 Query 子表自身预算' },
];
