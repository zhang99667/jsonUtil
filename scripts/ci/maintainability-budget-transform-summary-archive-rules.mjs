import { transformSummaryCollaborationMaintainabilityBudgets } from './maintainability-budget-transform-summary-collaboration-rules.mjs';

export const transformSummaryArchiveMaintainabilityBudgets = [
  ...transformSummaryCollaborationMaintainabilityBudgets,
  {
    file: 'frontend/src/utils/transformArchivePackage.ts',
    maxLines: 125,
    reason: '深度解析归档包组装应保持纯数据编排模块，安全清单和推荐文件名不得回流到报告聚合文件',
  },
];
