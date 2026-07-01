import { transformSummaryInsightSchemaMaintainabilityBudgets } from './maintainability-budget-transform-summary-insight-schema-rules.mjs';

const summaryInsightBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const transformSummaryInsightMaintainabilityBudgets = [
  summaryInsightBudget('frontend/src/utils/transformReportCoverage.ts', 80, '深度解析报告覆盖率评分和提示应保持纯函数模块，避免回流到报告聚合文件'),
  summaryInsightBudget('frontend/src/utils/transformReportCmdStructureSource.ts', 100, '深度解析 CMD 结构源、参数摘要和复制 getter 应保持独立纯函数，避免回流到报告聚合文件'),
  summaryInsightBudget('frontend/src/utils/transformReportNestedFieldGroups.ts', 85, '深度解析嵌套字段 Top 分组应复用独立 helper，避免 CMD 字段和资源字段重复 Map/排序逻辑'),
  summaryInsightBudget('frontend/src/utils/transformReportRecordInsights.ts', 170, '深度解析记录洞察字段构建应保持独立纯函数，避免内部 CMD、资源 URL、ext 和 Base64 后缀线索回流到报告聚合文件'),
  ...transformSummaryInsightSchemaMaintainabilityBudgets,
  summaryInsightBudget('frontend/src/utils/transformTroubleshootingRecipe.ts', 220, '深度解析排查 recipe 应保持纯数据组装，避免回流到报告聚合文件'),
];
