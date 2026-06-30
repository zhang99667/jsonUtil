export const transformSummaryArtifactTypesMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformSummaryArtifactTypes.ts',
    maxLines: 230,
    reason: '深度解析样本导出、占位符模板、质量快照和归档包类型应独立维护，避免核心报告类型入口回涨',
  },
  {
    file: 'frontend/src/utils/transformSummaryGroupTypes.ts',
    maxLines: 55,
    reason: '深度解析 schema、资源类型和嵌套字段分组类型应独立维护，避免 artifact 类型反向依赖核心入口',
  },
];
