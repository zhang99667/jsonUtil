import { transformSummaryCollaborationMaintainabilityBudgets } from './maintainability-budget-transform-summary-collaboration-rules.mjs';

export const transformSummaryArchiveMaintainabilityBudgets = [
  ...transformSummaryCollaborationMaintainabilityBudgets,
  {
    file: 'frontend/src/utils/transformArchivePackage.ts',
    maxLines: 95,
    reason: '深度解析归档包组装应只编排报告产物，安全清单和推荐文件名不得回流到主组装函数',
  },
  {
    file: 'frontend/src/utils/transformArchivePackageMetadata.ts',
    maxLines: 45,
    reason: '深度解析归档包元数据 helper 只维护安全清单和 corpus 候选文件名',
  },
];
