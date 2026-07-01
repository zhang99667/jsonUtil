export const appWorkflowStateHelperMaintainabilityBudgets = [
  { file: 'frontend/src/hooks/useAppTransformContextPersistence.ts', maxLines: 45, reason: 'App 转换上下文持久化 hook 只维护 deep format context 写回 Tab 或 fallback ref' },
  { file: 'frontend/src/hooks/useAppTransformContextPersistence.test.ts', maxLines: 110, reason: 'App 转换上下文持久化测试只锁定无结果、有 Tab 和无 Tab 三种写入路径' },
  { file: 'frontend/src/utils/appTransformOutput.ts', maxLines: 115, reason: 'App 转换输出派生 helper 只维护 deep format、异步结果和 PREVIEW 暂存输出优先级' },
  { file: 'frontend/src/utils/appTransformOutput.test.ts', maxLines: 160, reason: 'App 转换输出派生测试只锁定 deep format、异步占位和 PREVIEW 暂存优先级' },
  { file: 'frontend/src/hooks/useAppPreviewOutputSync.ts', maxLines: 180, reason: 'PREVIEW 反向同步 hook 只维护编辑暂存、校验 requestId、防抖回写和解锁时序' },
  { file: 'frontend/src/hooks/useAppPreviewOutputSync.test.ts', maxLines: 160, reason: 'PREVIEW 反向同步 hook 测试只锁定防抖回写、连续编辑失效、延迟解锁和非法内容不覆盖 SOURCE' },
  { file: 'frontend/src/utils/appPreviewOutputSync.ts', maxLines: 50, reason: 'PREVIEW 反向同步纯 helper 只维护校验模式判断和 source 还原选择' },
  { file: 'frontend/src/utils/appPreviewOutputSync.test.ts', maxLines: 70, reason: 'PREVIEW 反向同步 helper 测试只锁定校验模式、context 回写和无 context fallback' },
  { file: 'frontend/src/hooks/useAppLazyPanelLoadState.ts', maxLines: 60, reason: '懒加载面板 loaded hook 只装配 open 状态、粘性合并和依赖列表' },
  { file: 'frontend/src/hooks/useAppLazyPanelLoadState.test.ts', maxLines: 90, reason: '懒加载面板 loaded hook 测试只锁定默认初始化、打开后加载和关闭后粘性保留' },
];
