export const transformSummaryInsightSchemaMaintainabilityBudgets = [
  { file: 'frontend/src/utils/transformReportDecodedPathResource.ts', maxLines: 45, reason: '深度解析资源字段 schema 提取和类型补充应共享纯 helper，避免 occurrence 与记录洞察重复 URL source 规则' },
  { file: 'frontend/src/utils/transformReportCommandSchemaOccurrenceFactory.ts', maxLines: 70, reason: '深度解析 command/resource schema occurrence 构造应保持独立纯 helper，避免记录扫描入口承担资源 source 提取和类型判定' },
  { file: 'frontend/src/utils/transformReportCommandSchemaOccurrences.ts', maxLines: 35, reason: '深度解析 command/resource schema occurrence 收集入口应只负责遍历记录，避免分组聚合文件承担 source 提取' },
  { file: 'frontend/src/utils/transformReportCommandSchemaGroupOptions.ts', maxLines: 20, reason: '深度解析 schema 分组默认上限应集中管理，避免资源类型和 origin 分组重复常量' },
  { file: 'frontend/src/utils/transformReportCommandSchemaOriginGroups.ts', maxLines: 95, reason: '深度解析 schema origin 归并应保持独立纯聚合函数，避免主 schema 分组入口继续承载 origin 规则' },
  { file: 'frontend/src/utils/transformReportResourceTypeGroupDrafts.ts', maxLines: 70, reason: '深度解析资源类型草稿聚合应保持独立纯函数，避免展示映射规则和计数去重互相耦合' },
  { file: 'frontend/src/utils/transformReportResourceTypeGroupResults.ts', maxLines: 55, reason: '深度解析资源类型结果映射应保持独立纯函数，避免排序、百分比和标签拼装回流到 occurrence 聚合' },
  { file: 'frontend/src/utils/transformReportResourceTypeGroups.ts', maxLines: 85, reason: '深度解析资源类型分组应保持独立纯聚合函数，避免主 schema 分组入口继续承载资源类型规则' },
  { file: 'frontend/src/utils/transformReportCommandSchemaGroups.ts', maxLines: 125, reason: '深度解析 command/resource schema 分组入口应只保留 schema 维度聚合和兼容导出，occurrence 收集不得回流' },
];
