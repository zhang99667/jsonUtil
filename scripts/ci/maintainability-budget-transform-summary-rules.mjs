import { transformSummarySupportMaintainabilityBudgets } from './maintainability-budget-transform-summary-support-rules.mjs';
import { transformSummaryTextMaintainabilityBudgets } from './maintainability-budget-transform-summary-text-rules.mjs';

export const transformSummaryMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformSummary.ts',
    maxLines: 1320,
    reason: '深度解析报告聚合仍是最大债务文件，新增规则应优先拆到独立模块，文本段落、排查 recipe、质量快照、问题样本、占位符回填模板、decoded value、CMD 结构源、记录洞察、嵌套字段分组和 schema 分组不得回流',
  },
  ...transformSummaryTextMaintainabilityBudgets,
  ...transformSummarySupportMaintainabilityBudgets,
];
