export const appWorkflowStateMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/appAsyncPolicy.ts',
    maxLines: 80,
    reason: '主应用异步转换与校验阈值策略应保持纯函数和集中测试',
  },
  {
    file: 'frontend/src/utils/appAsyncTransformState.ts',
    maxLines: 120,
    reason: '主应用异步转换结果 freshness 和输出选择应保持纯函数，副作用留在 App 主入口',
  },
  { file: 'frontend/src/hooks/useAppPreviewOutputSync.ts', maxLines: 180, reason: 'PREVIEW 反向同步 hook 只维护编辑暂存、校验 requestId、防抖回写和解锁时序' },
  { file: 'frontend/src/hooks/useAppPreviewOutputSync.test.ts', maxLines: 160, reason: 'PREVIEW 反向同步 hook 测试只锁定防抖回写、连续编辑失效、延迟解锁和非法内容不覆盖 SOURCE' },
  { file: 'frontend/src/utils/appPreviewOutputSync.ts', maxLines: 50, reason: 'PREVIEW 反向同步纯 helper 只维护校验模式判断和 source 还原选择' },
  { file: 'frontend/src/utils/appPreviewOutputSync.test.ts', maxLines: 70, reason: 'PREVIEW 反向同步 helper 测试只锁定校验模式、context 回写和无 context fallback' },
  {
    file: 'frontend/src/utils/appEditorUiState.ts',
    maxLines: 130,
    reason: '主应用编辑区派生状态和按钮文案应集中在纯函数模块',
  },
  {
    file: 'frontend/src/utils/appLazyPanelLoadState.ts',
    maxLines: 60,
    reason: '主应用懒加载面板 loaded 状态应保持纯粘性状态合并逻辑',
  },
];
