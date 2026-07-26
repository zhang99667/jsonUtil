const appJsonCompareBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonCompareMaintainabilityBudgets = [
  appJsonCompareBudget('frontend/src/utils/jsonSemanticDiff.ts', 285, 'JSON 语义对比应保持迭代遍历、稳定差异顺序、忽略路径和报告格式职责，不回退到递归遍历'),
  appJsonCompareBudget('frontend/src/utils/jsonSemanticDiff.test.ts', 215, 'JSON 语义对比测试只锁定差异语义、路径转义、忽略规则、上限和深层结构边界'),
];
