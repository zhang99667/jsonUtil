export const transformSummaryInsightSchemaCommandMaintainabilityBudgets = [
  { file: 'frontend/src/utils/transformReportCommandSchemaOccurrenceFactory.ts', maxLines: 70, reason: '深度解析 command/resource schema occurrence 构造应保持独立纯 helper，避免记录扫描入口承担资源 source 提取和类型判定' },
  { file: 'frontend/src/utils/transformReportCommandSchemaOccurrences.ts', maxLines: 35, reason: '深度解析 command/resource schema occurrence 收集入口应只负责遍历记录，避免分组聚合文件承担 source 提取' },
  { file: 'frontend/src/utils/transformReportCommandSchemaGroupOptions.ts', maxLines: 20, reason: '深度解析 schema 分组默认上限应集中管理，避免资源类型和 origin 分组重复常量' },
  { file: 'frontend/src/utils/transformReportCommandSchemaOrigin.ts', maxLines: 25, reason: '深度解析 schema origin 字符串归一化应保持独立纯 helper，避免 origin 提取规则回流到分组聚合' },
  { file: 'frontend/src/utils/transformReportCommandSchemaOriginGroupDraftState.ts', maxLines: 45, reason: '深度解析 schema origin 草稿状态应独立维护 Set 去重和可见 schema 截断规则' },
  { file: 'frontend/src/utils/transformReportCommandSchemaOriginGroupDrafts.ts', maxLines: 45, reason: '深度解析 schema origin 草稿聚合应只维护 occurrence 遍历和 origin 分组路由' },
  { file: 'frontend/src/utils/transformReportCommandSchemaOriginGroupResults.ts', maxLines: 45, reason: '深度解析 schema origin 结果映射应独立维护排序和展示字段拼装' },
  { file: 'frontend/src/utils/transformReportCommandSchemaOriginGroups.ts', maxLines: 45, reason: '深度解析 schema origin 归并入口应只组合 occurrence 收集、草稿聚合和结果映射' },
  { file: 'frontend/src/utils/transformReportCommandSchemaGroups.ts', maxLines: 125, reason: '深度解析 command/resource schema 分组入口应只保留 schema 维度聚合和兼容导出，occurrence 收集不得回流' },
];
