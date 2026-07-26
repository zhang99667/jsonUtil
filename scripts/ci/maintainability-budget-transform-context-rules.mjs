export const transformContextMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformContextExpansion.ts',
    maxLines: 140,
    reason: '上下文展开只维护迭代深度优先遍历、路径传递和子树收尾回调',
  },
  {
    file: 'frontend/src/utils/transformContextExpansion.test.ts',
    maxLines: 40,
    reason: '上下文展开测试锁定深层末端转换与特殊键保真',
  },
  {
    file: 'frontend/src/utils/transformContextRestoration.ts',
    maxLines: 130,
    reason: '上下文还原只维护后序迭代遍历、路径定位和反向步骤应用',
  },
  {
    file: 'frontend/src/utils/transformContextRestoration.test.ts',
    maxLines: 60,
    reason: '上下文还原测试锁定深层末端回写与特殊键保真',
  },
];
