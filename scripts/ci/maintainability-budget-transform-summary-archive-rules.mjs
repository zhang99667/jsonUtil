export const transformSummaryArchiveMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformCollaborationReport.ts',
    maxLines: 130,
    reason: '深度解析协作排查报告应保持纯文本编排模块，避免协作材料文案回流到报告聚合文件',
  },
  {
    file: 'frontend/src/utils/transformArchivePackage.ts',
    maxLines: 125,
    reason: '深度解析归档包组装应保持纯数据编排模块，安全清单和推荐文件名不得回流到报告聚合文件',
  },
];
