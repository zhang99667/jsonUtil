import { transformContextMaintainabilityBudgets } from './maintainability-budget-transform-context-rules.mjs';
import { transformJsonValueMaintainabilityBudgets } from './maintainability-budget-transform-json-value-rules.mjs';

export const transformJsonObjectMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/jsonObjectProperty.ts',
    maxLines: 20,
    reason: 'JSON 对象属性写入只维护特殊键的普通自有属性语义',
  },
  ...transformJsonValueMaintainabilityBudgets,
  {
    file: 'frontend/src/utils/jsonKeySort.ts',
    maxLines: 55,
    reason: 'JSON 键排序只维护迭代复制和稳定键序',
  },
  {
    file: 'frontend/src/utils/jsonKeySort.test.ts',
    maxLines: 90,
    reason: 'JSON 键排序测试锁定深层对象、特殊键和三类输入入口',
  },
  ...transformContextMaintainabilityBudgets,
];
