export const appWorkflowStatePreviewSyncUtilsRuntimeMaintainabilityBudgets = [
  { file: 'frontend/src/utils/appPreviewOutputSync.ts', maxLines: 50, reason: 'PREVIEW 反向同步纯 helper 只维护校验模式判断和 source 还原选择' },
  { file: 'frontend/src/utils/mutableValueRef.ts', maxLines: 10, reason: '可写 ref 类型契约应保持极小，避免 PREVIEW 同步多处重复声明' },
  { file: 'frontend/src/utils/appPreviewOutputSyncRequest.ts', maxLines: 60, reason: 'PREVIEW 反向同步 request helper 只维护上下文选择、runner 调用和异常兜底' },
  { file: 'frontend/src/utils/appPreviewOutputSyncTask.ts', maxLines: 45, reason: 'PREVIEW 反向同步 task helper 只串联 request、失效检查和结果应用' },
  { file: 'frontend/src/utils/appPreviewOutputSyncTaskTypes.ts', maxLines: 40, reason: 'PREVIEW 反向同步 task 类型契约应独立维护，避免任务执行流程被入参声明撑大' },
  { file: 'frontend/src/utils/appPreviewOutputSyncTaskInput.ts', maxLines: 25, reason: 'PREVIEW 反向同步 task 输入 helper 只维护平铺字段到 request、refs 和 applyEffects 的显式分桶' },
  { file: 'frontend/src/utils/appPreviewOutputChangeTask.ts', maxLines: 20, reason: 'PREVIEW 输出变更 task adapter 只负责创建同步任务并交给 scheduler' },
  { file: 'frontend/src/utils/appPreviewOutputChangeHandler.ts', maxLines: 50, reason: 'PREVIEW 输出变更 handler helper 只串联草稿、即时校验和同步任务调度' },
  { file: 'frontend/src/utils/appPreviewOutputSyncRunner.ts', maxLines: 70, reason: 'PREVIEW 反向同步 runner 只维护同步前校验和 source 回写结果，不持有 React 状态' },
  { file: 'frontend/src/utils/appPreviewOutputSyncResult.ts', maxLines: 55, reason: 'PREVIEW 反向同步结果 helper 只维护失败草稿保留和成功回写副作用' },
];
