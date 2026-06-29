import { transformReportIssueMaintainabilityBudgets } from './maintainability-budget-transform-report-issue-rules.mjs';

export const transformReportMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformRuntimePlaceholders.ts',
    maxLines: 40,
    reason: '深度解析运行时占位符入口应只保留兼容导出，筛选和分组逻辑放到独立 helper',
  },
  {
    file: 'frontend/src/utils/transformRuntimePlaceholderTypes.ts',
    maxLines: 50,
    reason: '深度解析运行时占位符类型应独立承接数据契约，避免 helper 反向依赖报告聚合文件',
  },
  {
    file: 'frontend/src/utils/transformRuntimePlaceholderMatchers.ts',
    maxLines: 50,
    reason: '深度解析运行时占位符筛选应保持纯函数模块，避免回流到报告聚合文件',
  },
  {
    file: 'frontend/src/utils/transformRuntimePlaceholderGroups.ts',
    maxLines: 90,
    reason: '深度解析运行时占位符按值和来源聚合应保持纯函数模块',
  },
  {
    file: 'frontend/src/utils/transformSchemeParamStages.ts',
    maxLines: 100,
    reason: '深度解析参数分层入口只保留摘要合并、计数和兼容导出，bucket 与搜索逻辑需留在独立模块',
  },
  {
    file: 'frontend/src/utils/transformSchemeParamStageBuckets.ts',
    maxLines: 80,
    reason: '深度解析参数分层 Bucket 聚合和路径采样应保持纯函数模块，避免回流到参数分层入口',
  },
  {
    file: 'frontend/src/utils/transformSchemeParamStageSearch.ts',
    maxLines: 50,
    reason: '深度解析参数分层搜索文本应独立维护，避免筛选索引逻辑回流到摘要聚合入口',
  },
  {
    file: 'frontend/src/utils/transformStepLabels.ts',
    maxLines: 60,
    reason: '深度解析转换步骤标签应保持纯文案映射，避免回流到参数分层聚合模块',
  },
  ...transformReportIssueMaintainabilityBudgets,
];
