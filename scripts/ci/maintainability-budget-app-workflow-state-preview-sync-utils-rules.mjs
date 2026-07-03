export const appWorkflowStatePreviewSyncUtilsMaintainabilityBudgets = [
  { file: 'frontend/src/utils/appPreviewOutputSync.ts', maxLines: 50, reason: 'PREVIEW 反向同步纯 helper 只维护校验模式判断和 source 还原选择' },
  { file: 'frontend/src/utils/appPreviewOutputSync.test.ts', maxLines: 70, reason: 'PREVIEW 反向同步 helper 测试只锁定校验模式、context 回写和无 context fallback' },
  { file: 'frontend/src/utils/mutableValueRef.ts', maxLines: 10, reason: '可写 ref 类型契约应保持极小，避免 PREVIEW 同步多处重复声明' },
  { file: 'frontend/src/utils/appPreviewOutputSyncRequest.ts', maxLines: 60, reason: 'PREVIEW 反向同步 request helper 只维护上下文选择、runner 调用和异常兜底' },
  { file: 'frontend/src/utils/appPreviewOutputSyncRequest.test.ts', maxLines: 95, reason: 'PREVIEW 反向同步 request 测试只锁定 Tab 上下文优先、fallback 和异常失败结果' },
  { file: 'frontend/src/utils/appPreviewOutputSyncTask.ts', maxLines: 45, reason: 'PREVIEW 反向同步 task helper 只串联 request、失效检查和结果应用' },
  { file: 'frontend/src/utils/appPreviewOutputSyncTaskTypes.ts', maxLines: 40, reason: 'PREVIEW 反向同步 task 类型契约应独立维护，避免任务执行流程被入参声明撑大' },
  { file: 'frontend/src/utils/appPreviewOutputSyncTask.test.ts', maxLines: 85, reason: 'PREVIEW 反向同步 task 测试只锁定执行时快照读取和失效任务不应用结果' },
  { file: 'frontend/src/utils/appPreviewOutputSyncRunner.ts', maxLines: 70, reason: 'PREVIEW 反向同步 runner 只维护同步前校验和 source 回写结果，不持有 React 状态' },
  { file: 'frontend/src/utils/appPreviewOutputSyncRunner.test.ts', maxLines: 80, reason: 'PREVIEW 反向同步 runner 测试只锁定 invalid、synced 和非格式化跳过校验路径' },
  { file: 'frontend/src/utils/appPreviewOutputSyncResult.ts', maxLines: 55, reason: 'PREVIEW 反向同步结果 helper 只维护失败草稿保留和成功回写副作用' },
  { file: 'frontend/src/utils/appPreviewOutputSyncResult.test.ts', maxLines: 65, reason: 'PREVIEW 反向同步结果测试只锁定失败保留草稿和成功写回 SOURCE' },
];
