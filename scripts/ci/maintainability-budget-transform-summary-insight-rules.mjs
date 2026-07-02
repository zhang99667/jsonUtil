import { transformSummaryInsightSchemaMaintainabilityBudgets } from './maintainability-budget-transform-summary-insight-schema-rules.mjs';

const summaryInsightBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const transformSummaryInsightMaintainabilityBudgets = [
  summaryInsightBudget('frontend/src/utils/transformReportCoverage.ts', 45, '深度解析报告覆盖率入口只负责分数计算和 warning/unresolved/placeholder/success 优先级路由'),
  summaryInsightBudget('frontend/src/utils/transformReportCoverageDetails.ts', 80, '深度解析报告覆盖率提示详情应集中维护四类覆盖结果的文案和行动项'),
  summaryInsightBudget('frontend/src/utils/transformReportCoverageScore.ts', 25, '深度解析报告覆盖率分数 helper 应只维护 record 与待关注线索的百分比分数'),
  summaryInsightBudget('frontend/src/utils/transformReportCoverageTypes.ts', 25, '深度解析报告覆盖率类型契约应独立维护，避免入口文件因类型声明回涨'),
  summaryInsightBudget('frontend/src/utils/transformReportCmdStructureSource.ts', 100, '深度解析 CMD 结构源、参数摘要和复制 getter 应保持独立纯函数，避免回流到报告聚合文件'),
  summaryInsightBudget('frontend/src/utils/transformReportNestedFieldGroups.ts', 85, '深度解析嵌套字段 Top 分组应复用独立 helper，避免 CMD 字段和资源字段重复 Map/排序逻辑'),
  summaryInsightBudget('frontend/src/utils/transformReportRecordInsights.ts', 170, '深度解析记录洞察字段构建应保持独立纯函数，避免内部 CMD、资源 URL、ext 和 Base64 后缀线索回流到报告聚合文件'),
  ...transformSummaryInsightSchemaMaintainabilityBudgets,
  summaryInsightBudget('frontend/src/utils/transformTroubleshootingRecipe.ts', 115, '深度解析排查 recipe 入口只组装最终 recipe 对象，步骤编排和类型契约保持独立'),
  summaryInsightBudget('frontend/src/utils/transformTroubleshootingRecipeSteps.ts', 130, '深度解析排查 recipe 步骤编排只维护步骤启用条件和依赖关系'),
  summaryInsightBudget('frontend/src/utils/transformTroubleshootingRecipeTypes.ts', 55, '深度解析排查 recipe 类型契约应独立维护，避免入口文件因导出类型继续膨胀'),
];
