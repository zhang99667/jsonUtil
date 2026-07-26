export const governanceTransformJsonMaintainabilityBudgets = [
  { file: 'scripts/ci/maintainability-budget-transform-json-object-rules.mjs', maxLines: 35, reason: 'JSON 对象预算规则只聚合特殊键、JSON 值、键排序和上下文子表' },
  { file: 'scripts/ci/maintainability-budget-transform-json-value-rules.mjs', maxLines: 35, reason: 'JSON 值预算规则只维护值守卫、消费边界和栈安全序列化条目' },
  { file: 'scripts/ci/maintainability-budget-transform-context-rules.mjs', maxLines: 30, reason: '上下文预算规则只维护正向展开与反向还原边界' },
  { file: 'scripts/ci/maintainability-budget-governance-transform-json-rules.mjs', maxLines: 10, reason: 'JSON 转换治理预算规则只维护 JSON 子表自身预算' },
];
