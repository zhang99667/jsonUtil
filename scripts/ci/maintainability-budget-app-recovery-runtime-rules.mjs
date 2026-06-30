export const appRecoveryRuntimeMaintainabilityBudgets = [
  {
    file: 'frontend/src/hooks/useAppChunkLoadRecovery.tsx',
    maxLines: 70,
    reason: '动态 chunk 加载失败恢复 hook 应只装配 Toast 与事件监听安装，不承载识别和去重逻辑',
  },
  {
    file: 'frontend/src/hooks/useAppLazyPanelWarmup.ts',
    maxLines: 50,
    reason: '懒加载面板预热 hook 应只在空闲时预取高频面板 chunk，不夹带业务状态',
  },
  {
    file: 'frontend/src/utils/chunkLoadRecovery.ts',
    maxLines: 50,
    reason: 'chunk 加载失败识别应保持纯字符串归一化和模式匹配',
  },
  {
    file: 'frontend/src/utils/chunkLoadRecoveryEvents.ts',
    maxLines: 70,
    reason: 'chunk 恢复事件安装应只负责监听、阻止默认错误和一次性刷新提示',
  },
  {
    file: 'frontend/src/components/AppUpdateToastContent.tsx',
    maxLines: 70,
    reason: '新版本提示 Toast 应只负责展示版本信息和透传查看、刷新、关闭动作',
  },
  {
    file: 'frontend/src/components/ErrorBoundary.tsx',
    maxLines: 110,
    reason: '全局错误边界应保持兜底展示和少量恢复动作，不承载业务流程',
  },
];
