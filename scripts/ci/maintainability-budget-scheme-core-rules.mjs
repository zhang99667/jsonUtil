import { schemeCoreHelperMaintainabilityBudgets } from './maintainability-budget-scheme-core-helper-rules.mjs';
import { schemeCoreParamMaintainabilityBudgets } from './maintainability-budget-scheme-core-param-rules.mjs';

export const schemeCoreMaintainabilityBudgets = [
  ...schemeCoreParamMaintainabilityBudgets,
  ...schemeCoreHelperMaintainabilityBudgets,
  {
    file: 'frontend/src/utils/schemeUtils.ts',
    maxLines: 750,
    reason: 'Scheme 解码核心应聚焦递归解码编排，新增协议规则应优先沉淀测试和 helper',
  },
  {
    file: 'frontend/src/utils/schemeTypes.ts',
    maxLines: 80,
    reason: 'Scheme 公共类型契约应独立维护，避免占位符、参数 stage 和编码 helper 反向依赖核心解码入口',
  },
  {
    file: 'frontend/src/utils/schemeScanner.ts',
    maxLines: 135,
    reason: 'Scheme 扫描器只负责定位解析、迭代遍历、结果截断与兼容出口',
  },
  {
    file: 'frontend/src/utils/schemeScanner.test.ts',
    maxLines: 30,
    reason: 'Scheme 扫描器直接测试只锁定深层结构和静默失败边界',
  },
];
