import { transformSummaryCollaborationMaintainabilityBudgets } from './maintainability-budget-transform-summary-collaboration-rules.mjs';

export const transformSummaryArchiveMaintainabilityBudgets = [
  ...transformSummaryCollaborationMaintainabilityBudgets,
  {
    file: 'frontend/src/utils/transformArchivePackage.ts',
    maxLines: 65,
    reason: '深度解析归档包组装应只编排 envelope，artifacts、安全清单和推荐文件名不得回流到主函数',
  },
  {
    file: 'frontend/src/utils/transformArchivePackageArtifacts.ts',
    maxLines: 70,
    reason: '深度解析归档包 artifacts helper 只维护诊断摘要、协作报告、质量快照和脱敏产物组装',
  },
  {
    file: 'frontend/src/utils/transformArchivePackageMetadata.ts',
    maxLines: 45,
    reason: '深度解析归档包元数据 helper 只维护安全清单和 corpus 候选文件名',
  },
];
