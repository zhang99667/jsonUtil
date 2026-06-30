import { transformSummaryArtifactTypesMaintainabilityBudgets } from './maintainability-budget-transform-summary-artifact-types-rules.mjs';

export const transformSummaryTypesMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformSummaryTypes.ts',
    maxLines: 210,
    reason: '深度解析核心报告和视图类型应独立维护，导出物和分组类型继续放在专用类型文件',
  },
  ...transformSummaryArtifactTypesMaintainabilityBudgets,
];
