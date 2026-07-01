export const appFileCloseMaintainabilityBudgets = [
  {
    file: 'frontend/src/hooks/useAppFileCloseGuard.ts',
    maxLines: 72,
    reason: '文件关闭保护 hook 应只维护 React 状态、beforeunload 和关闭确认副作用',
  },
  { file: 'frontend/src/hooks/useAppBeforeUnloadGuard.ts', maxLines: 35, reason: '离开页面保护 hook 应只维护 beforeunload 监听和未保存状态判断' },
  { file: 'frontend/src/hooks/useAppBeforeUnloadGuard.test.ts', maxLines: 80, reason: '离开页面保护测试只锁定拦截、不拦截和监听清理行为' },
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
