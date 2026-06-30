export const appFileCloseMaintainabilityBudgets = [
  {
    file: 'frontend/src/hooks/useAppFileCloseGuard.ts',
    maxLines: 72,
    reason: '文件关闭保护 hook 应只维护 React 状态、beforeunload 和关闭确认副作用',
  },
  {
    file: 'frontend/src/utils/appFileCloseGuardState.ts',
    maxLines: 55,
    reason: '文件关闭保护状态 helper 应只维护未保存状态、pending 文件和关闭决策纯规则',
  },
  {
    file: 'frontend/src/utils/appFileCloseGuardState.test.ts',
    maxLines: 80,
    reason: '文件关闭保护状态测试只锁定脏文件、SOURCE 草稿、pending 查找和关闭决策矩阵',
  },
];
