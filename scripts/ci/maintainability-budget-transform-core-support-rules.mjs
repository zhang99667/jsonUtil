export const transformCoreSupportMaintainabilityBudgets = [
  { file: 'frontend/src/utils/transformContextCollectors.ts', maxLines: 110, reason: '深度解析收集器只维护候选、占位符与性能警告的有界写入契约' },
  { file: 'frontend/src/utils/transformContextCollectors.test.ts', maxLines: 120, reason: '收集器测试锁定预览、来源路径、去重与容量边界' },
  { file: 'frontend/src/utils/transformSchemeSteps.ts', maxLines: 130, reason: 'Scheme 步骤只维护参数摘要与 JSON 展开步骤元数据' },
  { file: 'frontend/src/utils/transformSchemeSteps.test.ts', maxLines: 100, reason: 'Scheme 步骤测试锁定摘要截断、对象展开和非对象负例' },
];
