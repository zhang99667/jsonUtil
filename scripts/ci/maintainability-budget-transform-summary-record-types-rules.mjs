export const transformSummaryRecordTypesMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformSummaryRecordTypes.ts',
    maxLines: 95,
    reason: '深度解析记录、警告和未解析候选类型应独立维护，路径行类型应留在独立类型文件',
  },
  {
    file: 'frontend/src/utils/transformSummaryDecodedPathTypes.ts',
    maxLines: 35,
    reason: '深度解析 decoded path 与 schema row 类型应独立维护，避免记录类型入口回涨',
  },
];
