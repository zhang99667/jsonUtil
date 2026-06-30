import { schemeCoreHelperMaintainabilityBudgets } from './maintainability-budget-scheme-core-helper-rules.mjs';
import { schemeCoreParamMaintainabilityBudgets } from './maintainability-budget-scheme-core-param-rules.mjs';

export const schemeCoreMaintainabilityBudgets = [
  ...schemeCoreParamMaintainabilityBudgets,
  ...schemeCoreHelperMaintainabilityBudgets,
  {
    file: 'frontend/src/utils/schemeUtils.ts',
    maxLines: 950,
    reason: 'Scheme 解码核心应聚焦递归解码编排，新增协议规则应优先沉淀测试和 helper',
  },
  {
    file: 'frontend/src/utils/schemeTypes.ts',
    maxLines: 80,
    reason: 'Scheme 公共类型契约应独立维护，避免占位符、参数 stage 和编码 helper 反向依赖核心解码入口',
  },
];
