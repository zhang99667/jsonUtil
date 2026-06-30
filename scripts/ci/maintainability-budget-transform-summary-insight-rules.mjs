export const transformSummaryInsightMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportCoverage.ts',
    maxLines: 80,
    reason: '深度解析报告覆盖率评分和提示应保持纯函数模块，避免回流到报告聚合文件',
  },
  {
    file: 'frontend/src/utils/transformReportCmdStructureSource.ts',
    maxLines: 100,
    reason: '深度解析 CMD 结构源、参数摘要和复制 getter 应保持独立纯函数，避免回流到报告聚合文件',
  },
  {
    file: 'frontend/src/utils/transformReportNestedFieldGroups.ts',
    maxLines: 85,
    reason: '深度解析嵌套字段 Top 分组应复用独立 helper，避免 CMD 字段和资源字段重复 Map/排序逻辑',
  },
  {
    file: 'frontend/src/utils/transformReportRecordInsights.ts',
    maxLines: 170,
    reason: '深度解析记录洞察字段构建应保持独立纯函数，避免内部 CMD、资源 URL、ext 和 Base64 后缀线索回流到报告聚合文件',
  },
  { file: 'frontend/src/utils/transformReportDecodedPathResource.ts', maxLines: 45, reason: '深度解析资源字段 schema 提取和类型补充应共享纯 helper，避免 occurrence 与记录洞察重复 URL source 规则' },
  { file: 'frontend/src/utils/transformReportCommandSchemaOccurrenceFactory.ts', maxLines: 70, reason: '深度解析 command/resource schema occurrence 构造应保持独立纯 helper，避免记录扫描入口承担资源 source 提取和类型判定' },
  { file: 'frontend/src/utils/transformReportCommandSchemaOccurrences.ts', maxLines: 35, reason: '深度解析 command/resource schema occurrence 收集入口应只负责遍历记录，避免分组聚合文件承担 source 提取' },
  { file: 'frontend/src/utils/transformReportCommandSchemaGroups.ts', maxLines: 250, reason: '深度解析 command/resource schema、origin 和资源类型分组应保持独立纯聚合函数，occurrence 收集不得回流' },
  {
    file: 'frontend/src/utils/transformTroubleshootingRecipe.ts',
    maxLines: 220,
    reason: '深度解析排查 recipe 应保持纯数据组装，避免回流到报告聚合文件',
  },
];
