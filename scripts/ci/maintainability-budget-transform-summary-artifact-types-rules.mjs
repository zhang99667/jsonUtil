const summaryArtifactTypesBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const transformSummaryArtifactTypesMaintainabilityBudgets = [
  summaryArtifactTypesBudget('frontend/src/utils/transformSummaryArtifactTypes.ts', 30, '深度解析导出物类型入口只维护 artifact 类型 re-export，具体类型继续放在专用文件'),
  summaryArtifactTypesBudget('frontend/src/utils/transformSummaryIssueSampleSummaryTypes.ts', 30, '深度解析问题样本 summary 计数结构独立维护，避免导出对象类型继续膨胀'),
  summaryArtifactTypesBudget('frontend/src/utils/transformSummaryIssueSampleItemTypes.ts', 35, '深度解析问题样本 item 类型独立维护，避免单条样本字段继续挤占导出对象入口'),
  summaryArtifactTypesBudget('frontend/src/utils/transformSummaryIssueSampleTypes.ts', 35, '深度解析问题样本导出类型入口只维护导出对象、options 和兼容 re-export'),
  summaryArtifactTypesBudget('frontend/src/utils/transformSummaryPlaceholderFillTypes.ts', 50, '深度解析占位符回填模板类型应独立维护，避免 artifact 类型入口回涨'),
  summaryArtifactTypesBudget('frontend/src/utils/transformSummaryQualitySnapshotTypes.ts', 80, '深度解析质量快照类型应独立维护，避免 artifact 类型入口回涨'),
  summaryArtifactTypesBudget('frontend/src/utils/transformSummaryArchivePackageTypes.ts', 50, '深度解析归档包类型应独立维护，避免 artifact 类型入口回涨'),
  summaryArtifactTypesBudget('frontend/src/utils/transformSummaryGroupTypes.ts', 50, '深度解析 schema、资源类型和嵌套字段分组类型应独立维护，避免 artifact 类型反向依赖核心入口'),
];
