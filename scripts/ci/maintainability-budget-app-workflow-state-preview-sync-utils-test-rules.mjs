export const appWorkflowStatePreviewSyncUtilsTestMaintainabilityBudgets = [
  { file: 'frontend/src/utils/appPreviewOutputSync.test.ts', maxLines: 70, reason: 'PREVIEW 反向同步 helper 测试只锁定校验模式、context 回写和无 context fallback' },
  { file: 'frontend/src/utils/appPreviewOutputSyncRequest.test.ts', maxLines: 95, reason: 'PREVIEW 反向同步 request 测试只锁定 Tab 上下文优先、fallback 和异常失败结果' },
  { file: 'frontend/src/utils/appPreviewOutputSyncTask.test.ts', maxLines: 65, reason: 'PREVIEW 反向同步 task 测试只锁定执行时快照读取和失效任务不应用结果' },
  { file: 'frontend/src/utils/appPreviewOutputChangeTask.test.ts', maxLines: 45, reason: 'PREVIEW 输出变更 task 测试只锁定任务入参映射和 scheduler 调用' },
  { file: 'frontend/src/utils/appPreviewOutputChangeHandler.test.ts', maxLines: 50, reason: 'PREVIEW 输出变更 handler helper 测试只锁定草稿、即时校验和调度入参' },
  { file: 'frontend/src/utils/appPreviewOutputSyncTestFixture.ts', maxLines: 75, reason: 'PREVIEW 输出同步测试夹具只集中 request、refs、effects 与 task 输入构建' },
  { file: 'frontend/src/utils/appPreviewOutputChangeHandlerTestFixture.ts', maxLines: 35, reason: 'PREVIEW 输出变更 handler 测试夹具只装配 handler 专属草稿和校验输入' },
  { file: 'frontend/src/utils/appPreviewOutputSyncRunner.test.ts', maxLines: 80, reason: 'PREVIEW 反向同步 runner 测试只锁定 invalid、synced 和非格式化跳过校验路径' },
  { file: 'frontend/src/utils/appPreviewOutputSyncResult.test.ts', maxLines: 65, reason: 'PREVIEW 反向同步结果测试只锁定失败草稿保留和成功写回 SOURCE' },
];
