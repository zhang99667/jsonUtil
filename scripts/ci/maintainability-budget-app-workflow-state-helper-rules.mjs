export const appWorkflowStateHelperMaintainabilityBudgets = [
  { file: 'frontend/src/utils/appJsonSchemaEditorFeedback.ts', maxLines: 45, reason: 'App JSON Schema 编辑器反馈 helper 只维护 invalid warning 和诊断高亮映射' },
  { file: 'frontend/src/utils/appJsonSchemaEditorFeedback.test.ts', maxLines: 95, reason: 'App JSON Schema 编辑器反馈测试只锁定 invalid、valid/null 和 SOURCE 不可定位三种路径' },
  { file: 'frontend/src/hooks/useAppActiveFileModeSync.ts', maxLines: 35, reason: 'App 活动文件模式同步 hook 只维护当前 mode 写回当前 Tab' },
  { file: 'frontend/src/hooks/useAppActiveFileModeSync.test.ts', maxLines: 70, reason: 'App 活动文件模式同步测试只锁定无 Tab 跳过和当前 Tab 写回' },
  { file: 'frontend/src/hooks/useAppTransformContextPersistence.ts', maxLines: 45, reason: 'App 转换上下文持久化 hook 只维护 deep format context 写回 Tab 或 fallback ref' },
  { file: 'frontend/src/hooks/useAppTransformContextPersistence.test.ts', maxLines: 110, reason: 'App 转换上下文持久化测试只锁定无结果、有 Tab 和无 Tab 三种写入路径' },
  { file: 'frontend/src/utils/appTransformOutput.ts', maxLines: 115, reason: 'App 转换输出派生 helper 只维护 deep format、异步结果和 PREVIEW 暂存输出优先级' },
  { file: 'frontend/src/utils/appTransformOutput.test.ts', maxLines: 160, reason: 'App 转换输出派生测试只锁定 deep format、异步占位和 PREVIEW 暂存优先级' },
  { file: 'frontend/src/hooks/useAppLazyPanelLoadState.ts', maxLines: 60, reason: '懒加载面板 loaded hook 只装配 open 状态、粘性合并和依赖列表' },
  { file: 'frontend/src/hooks/useAppLazyPanelLoadState.test.ts', maxLines: 90, reason: '懒加载面板 loaded hook 测试只锁定默认初始化、打开后加载和关闭后粘性保留' },
  { file: 'frontend/src/hooks/useAppSettingsState.ts', maxLines: 50, reason: 'App 设置状态 hook 只维护通用设置和 AI 设置的加载与本地持久化' },
  { file: 'frontend/src/hooks/useAppSettingsState.test.ts', maxLines: 85, reason: 'App 设置状态测试只锁定设置加载、返回状态和本地持久化 key' },
];
