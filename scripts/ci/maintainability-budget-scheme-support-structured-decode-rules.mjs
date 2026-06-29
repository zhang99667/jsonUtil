export const schemeSupportStructuredDecodeMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/schemeStructuredDecodeGuards.ts',
    maxLines: 25,
    reason: '整段 JSON response 字符串递归展开 guard 入口应只保留兼容导出',
  },
  {
    file: 'frontend/src/utils/schemeStructuredDecodeBudget.ts',
    maxLines: 40,
    reason: '整段 JSON response 字符串递归展开预算累计和跳过判定应独立于公开 guard 入口',
  },
  {
    file: 'frontend/src/utils/schemeStructuredDecodeSkip.ts',
    maxLines: 40,
    reason: '整段 JSON response 字符串递归展开跳过预算判定与路径记录应独立于公开 guard 入口',
  },
  {
    file: 'frontend/src/utils/schemeStructuredDecodeState.ts',
    maxLines: 40,
    reason: '整段 JSON response 字符串递归展开默认阈值和 state factory 应独立于跳过判定',
  },
  {
    file: 'frontend/src/utils/schemeStructuredDecodeWarnings.ts',
    maxLines: 40,
    reason: '整段 JSON response 字符串递归展开 warning 构造应独立于预算状态机',
  },
  {
    file: 'frontend/src/utils/schemeStructuredDecodeTypes.ts',
    maxLines: 40,
    reason: '整段 JSON response 字符串递归展开预算类型应稳定集中，避免散落到 Scheme 主流程',
  },
];
