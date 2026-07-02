import { transformSummaryArtifactTypesMaintainabilityBudgets } from './maintainability-budget-transform-summary-artifact-types-rules.mjs';
import { transformSummaryRecordTypesMaintainabilityBudgets } from './maintainability-budget-transform-summary-record-types-rules.mjs';

export const transformSummaryTypesMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformSummaryTypes.ts',
    maxLines: 135,
    reason: '深度解析核心报告和视图类型入口只维护报告聚合、视图契约和类型 re-export，记录类型继续放在专用文件',
  },
  ...transformSummaryRecordTypesMaintainabilityBudgets,
  ...transformSummaryArtifactTypesMaintainabilityBudgets,
];
