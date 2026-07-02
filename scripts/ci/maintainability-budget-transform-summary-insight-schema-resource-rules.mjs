export const transformSummaryInsightSchemaResourceMaintainabilityBudgets = [
  { file: 'frontend/src/utils/transformReportDecodedPathResource.ts', maxLines: 45, reason: '深度解析资源字段 schema 提取和类型补充应共享纯 helper，避免 occurrence 与记录洞察重复 URL source 规则' },
  { file: 'frontend/src/utils/transformReportResourceTypeGroupDrafts.ts', maxLines: 70, reason: '深度解析资源类型草稿聚合应保持独立纯函数，避免展示映射规则和计数去重互相耦合' },
  { file: 'frontend/src/utils/transformReportResourceTypeGroupResults.ts', maxLines: 55, reason: '深度解析资源类型结果映射应保持独立纯函数，避免排序、百分比和标签拼装回流到 occurrence 聚合' },
  { file: 'frontend/src/utils/transformReportResourceTypeGroups.ts', maxLines: 85, reason: '深度解析资源类型分组应保持独立纯聚合函数，避免主 schema 分组入口继续承载资源类型规则' },
];
