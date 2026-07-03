export const appWorkflowStatePreviewSyncHookRuntimeMaintainabilityBudgets = [
  { file: 'frontend/src/hooks/useAppPreviewOutputSync.ts', maxLines: 70, reason: 'PREVIEW 反向同步 hook 只维护派生校验、取消清理和输出变更 handler 装配' },
  { file: 'frontend/src/hooks/useAppPreviewOutputSyncTypes.ts', maxLines: 35, reason: 'PREVIEW 反向同步 hook 类型契约应独立维护，避免副作用流程被 props 声明撑大' },
  { file: 'frontend/src/hooks/useAppPreviewDraftFileChangeReset.ts', maxLines: 25, reason: 'PREVIEW 草稿文件切换重置 hook 只维护活动文件变化检测和取消草稿副作用' },
  { file: 'frontend/src/hooks/useAppPreviewOutputDraftScheduler.ts', maxLines: 30, reason: 'PREVIEW 草稿调度 hook 只负责将草稿清理函数接入同步 scheduler' },
  { file: 'frontend/src/hooks/useAppPreviewOutputChangeHandler.ts', maxLines: 70, reason: 'PREVIEW 输出变更 handler hook 只维护草稿开始、即时校验和同步任务调度' },
  { file: 'frontend/src/hooks/useAppPreviewOutputSyncScheduler.ts', maxLines: 90, reason: 'PREVIEW 反向同步 scheduler hook 只维护防抖、requestId 失效、取消和延迟解锁时序' },
];
