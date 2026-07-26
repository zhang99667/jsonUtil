export const schemeSupportMetadataDeepTestMaintainabilityBudgets = [
  { file: 'frontend/src/utils/schemeMetadataCmdHandlerDeepTraversal.test.ts', maxLines: 25, reason: 'Scheme CMD 导出测试锁定深层参数包装和安全属性写入' },
  { file: 'frontend/src/utils/schemeMetadataCommandSchemaRowsDeepTraversal.test.ts', maxLines: 25, reason: 'Scheme 命令 Schema 测试锁定七千层对象数组混合链的 source 对齐与收集' },
  { file: 'frontend/src/utils/schemeMetadataPrimaryCommandDeepTraversal.test.ts', maxLines: 25, reason: 'Scheme 主命令测试锁定七千层对象数组混合链的定位与导出' },
  { file: 'frontend/src/utils/schemeMetadataInsightDeepTraversal.test.ts', maxLines: 25, reason: 'Scheme 洞察测试锁定七千层对象数组混合链的 CMD 字段收集' },
  { file: 'frontend/src/utils/schemeMetadataSourceShapeDeepTraversal.test.ts', maxLines: 30, reason: 'Scheme source 测试锁定七千层形态归一化和特殊键保真' },
];
