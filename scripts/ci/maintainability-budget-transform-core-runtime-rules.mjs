export const transformCoreRuntimeMaintainabilityBudgets = [
  { file: 'frontend/src/utils/transformations.ts', maxLines: 780, reason: '核心转换只维护格式识别和正反转换编排，上下文与 Scheme 职责应留在纯函数模块' },
  { file: 'frontend/src/utils/jsonInputParser.ts', maxLines: 120, reason: 'JSON 输入与常见复制外壳识别应保持惰性匹配的纯解析模块' },
  {
    file: 'frontend/src/utils/transformations.test.ts',
    maxLines: 1410,
    reason: '核心转换测试锁定格式识别、正反转换和深度解析兼容边界，新增领域测试应独立分文件',
  },
  {
    file: 'frontend/src/utils/transformationsUrlDisplayHeader.test.ts',
    maxLines: 100,
    reason: 'URL 来源展示测试只锁定普通链接保护、来源字段冲突、逆变换和嵌套标记',
  },
];
