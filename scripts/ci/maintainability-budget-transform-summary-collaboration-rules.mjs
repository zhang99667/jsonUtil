export const transformSummaryCollaborationMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformCollaborationReport.ts',
    maxLines: 55,
    reason: '深度解析协作排查报告门面只维护版本、筛选、诊断摘要和 section 顺序装配',
  },
  {
    file: 'frontend/src/utils/transformCollaborationQualitySnapshotLines.ts',
    maxLines: 75,
    reason: '深度解析协作报告质量快照 helper 只维护覆盖、规模和 Top 列表文案',
  },
  {
    file: 'frontend/src/utils/transformCollaborationCmdHandlerLines.ts',
    maxLines: 60,
    reason: '深度解析协作报告 cmdHandler helper 只维护差异报告、候选和待对齐结构文案',
  },
];
