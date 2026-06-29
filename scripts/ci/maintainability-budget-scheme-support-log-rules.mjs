export const schemeSupportLogMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/schemeLogFields.ts',
    maxLines: 80,
    reason: '日志字段 CMD 解析入口应只保留业务字段和可解码判定，语法细节需拆到专用模块',
  },
  {
    file: 'frontend/src/utils/schemeLogFieldSyntax.ts',
    maxLines: 130,
    reason: '日志字段正则匹配、可解码值筛选和分隔符归一化应保持纯语法模块',
  },
  {
    file: 'frontend/src/utils/schemeLogFieldQuotes.ts',
    maxLines: 60,
    reason: '日志字段 key/value 引号解包应独立于正则匹配和业务字段判定',
  },
  {
    file: 'frontend/src/utils/schemeLogFieldTypes.ts',
    maxLines: 40,
    reason: '日志字段解析类型应保持稳定、集中导出',
  },
];
