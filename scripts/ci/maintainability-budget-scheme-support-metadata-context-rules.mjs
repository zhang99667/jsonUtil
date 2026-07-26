export const schemeSupportMetadataContextMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/schemeMetadataContext.ts',
    maxLines: 55,
    reason: 'Scheme 元数据上下文应只负责 decoded 与 source 的单次解析和不可变结果封装',
  },
  {
    file: 'frontend/src/utils/schemeMetadataContext.test.ts',
    maxLines: 90,
    reason: 'Scheme 元数据上下文测试应锁定非法值、合法 null、解析次数和格式化回退复用',
  },
  { file: 'frontend/src/utils/schemeCommandSource.ts', maxLines: 70, reason: 'Scheme 命令来源识别应统一规范化、类型探测和命令 Schema 提取' },
  { file: 'frontend/src/utils/schemeMetadataSourceTypes.ts', maxLines: 20, reason: 'Scheme source 递归类型与解析上下文应保持无运行时依赖' },
];
