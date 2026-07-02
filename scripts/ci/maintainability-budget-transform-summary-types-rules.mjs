import { transformSummaryArtifactTypesMaintainabilityBudgets } from './maintainability-budget-transform-summary-artifact-types-rules.mjs';
import { transformSummaryRecordTypesMaintainabilityBudgets } from './maintainability-budget-transform-summary-record-types-rules.mjs';

export const transformSummaryTypesMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformSummaryTypes.ts',
    maxLines: 105,
    reason: '深度解析核心报告类型入口只维护报告聚合和类型 re-export，记录与视图类型继续放在专用文件',
  },
  {
    file: 'frontend/src/utils/transformSummaryViewTypes.ts',
    maxLines: 70,
    reason: '深度解析视图类型只维护过滤统计、截断状态和视图记录集合契约',
  },
  ...transformSummaryRecordTypesMaintainabilityBudgets,
  ...transformSummaryArtifactTypesMaintainabilityBudgets,
];
