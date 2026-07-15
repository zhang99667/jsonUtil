export const appWorkflowStatePreviewSyncHookTestMaintainabilityBudgets = [
  { file: 'frontend/src/hooks/useAppPreviewValidation.test.ts', maxLines: 100, reason: 'PREVIEW 校验测试只锁定异常收敛、晚到隔离以及替换、回写和卸载取消' },
  { file: 'frontend/src/hooks/useAppPreviewOutputDraftScheduler.test.ts', maxLines: 60, reason: 'PREVIEW 草稿调度 hook 测试只锁定清理函数和 scheduler 装配' },
  { file: 'frontend/src/hooks/useAppPreviewDraftFileChangeReset.test.ts', maxLines: 55, reason: 'PREVIEW 草稿文件切换重置测试只锁定首次渲染和文件切换取消行为' },
  { file: 'frontend/src/hooks/useAppPreviewOutputChangeHandler.test.ts', maxLines: 55, reason: 'PREVIEW 输出变更 handler 测试只锁定草稿、校验和任务调度装配' },
  { file: 'frontend/src/hooks/useAppPreviewOutputSyncScheduler.test.ts', maxLines: 125, reason: 'PREVIEW 反向同步 scheduler 测试只锁定防抖、晚到任务、取消卸载和延迟解锁时序' },
  { file: 'frontend/src/hooks/useAppPreviewOutputSync.test.ts', maxLines: 95, reason: 'PREVIEW 反向同步 hook 测试只锁定防抖回写、连续编辑失效、延迟解锁和非法内容不覆盖 SOURCE' },
  { file: 'frontend/src/hooks/useAppPreviewOutputSyncCancel.test.ts', maxLines: 110, reason: 'PREVIEW 反向同步取消测试只锁定防抖任务、运行中校验和卸载不会晚到覆盖 SOURCE' },
  { file: 'frontend/src/hooks/useAppPreviewOutputSyncFailure.test.ts', maxLines: 50, reason: 'PREVIEW 反向同步失败测试只锁定异常不覆盖 SOURCE 且保留草稿' },
  { file: 'frontend/src/hooks/useAppPreviewOutputSyncTestFixture.ts', maxLines: 100, reason: 'PREVIEW 反向同步 hook 测试 fixture 只集中 React mock、校验 mock 和默认 hook 输入构建' },
  { file: 'frontend/src/hooks/useAppPreviewOutputSyncTestAssertions.ts', maxLines: 70, reason: 'PREVIEW 反向同步测试断言只维护 fake timer 推进和草稿/SOURCE/请求断言' },
];
