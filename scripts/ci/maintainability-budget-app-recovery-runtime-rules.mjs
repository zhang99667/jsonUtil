const runtimeBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appRecoveryRuntimeMaintainabilityBudgets = [
  runtimeBudget('frontend/src/hooks/useAppChunkLoadRecovery.tsx', 70, '动态 chunk 加载失败恢复 hook 应只装配 Toast 与事件监听安装，不承载识别和去重逻辑'),
  runtimeBudget('frontend/src/hooks/useAppLazyPanelWarmup.ts', 50, '懒加载面板预热 hook 应只在空闲时预取高频面板 chunk，不夹带业务状态'),
  runtimeBudget('frontend/src/utils/chunkLoadRecovery.ts', 50, 'chunk 加载失败识别应保持纯字符串归一化和模式匹配'),
  runtimeBudget('frontend/src/utils/chunkLoadRecoveryMessages.ts', 45, 'chunk 加载错误文本提取应保持纯递归读取和循环保护，不承载恢复策略'),
  runtimeBudget('frontend/src/utils/chunkLoadRecoveryResourceTargets.ts', 35, 'chunk 资源错误 target 判断应只识别构建产物 JS/CSS URL，避免普通图片加载失败误触发刷新'),
  runtimeBudget('frontend/src/utils/chunkLoadRecoveryDispatch.ts', 25, '手动 catch 内的 chunk 恢复派发应只做错误识别和 dispatch，不承载事件构造或业务提示'),
  runtimeBudget('frontend/src/utils/chunkLoadRecoveryDispatch.test.ts', 40, '手动 chunk 恢复派发测试只锁定无 target 和 dispatch 取消接管边界'),
  runtimeBudget('frontend/src/utils/chunkLoadRecoveryDispatchEvent.ts', 20, '手动 chunk 恢复事件工厂应只维护事件名、cancelable 和 payload 载荷契约'),
  runtimeBudget('frontend/src/utils/chunkLoadRecoveryDispatchTarget.ts', 20, '手动 chunk 恢复 dispatch target 应只维护浏览器默认派发目标适配'),
  runtimeBudget('frontend/src/utils/chunkLoadRecoveryDispatchEvent.test.ts', 35, '手动 chunk 恢复事件测试只锁定事件名、可取消和 payload 载荷语义'),
  runtimeBudget('frontend/src/utils/chunkLoadRecoveryEventPayloads.ts', 35, 'chunk 恢复事件 payload 提取应保持纯事件字段归一化，不承载监听安装逻辑'),
  runtimeBudget('frontend/src/utils/chunkLoadRecoveryEventHandlers.ts', 60, 'chunk 恢复事件 handler 工厂应只做事件载荷读取、恢复判定和 preventDefault，不承载监听注册'),
  runtimeBudget('frontend/src/utils/chunkLoadRecoveryEvents.ts', 70, 'chunk 恢复事件安装应只负责监听、阻止默认错误和一次性刷新提示'),
  runtimeBudget('frontend/src/utils/chunkLoadRecoveryEventTypes.ts', 35, 'chunk 恢复事件 target 与事件载荷契约应独立维护，避免事件安装实现被类型声明撑大'),
  runtimeBudget('frontend/src/components/AppUpdateToastContent.tsx', 70, '新版本提示 Toast 应只负责展示版本信息和透传查看、刷新、关闭动作'),
  runtimeBudget('frontend/src/components/ErrorBoundary.tsx', 110, '全局错误边界应保持兜底展示和少量恢复动作，不承载业务流程'),
];
