import { appInteractionScrollbarMaintainabilityBudgets } from './maintainability-budget-app-interaction-scrollbar-rules.mjs';
import { appTelemetryHookMaintainabilityBudgets } from './maintainability-budget-app-telemetry-hook-rules.mjs';

const interactionHookBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appInteractionHookMaintainabilityBudgets = [
  interactionHookBudget('frontend/src/hooks/useFeatureTour.ts', 340, '功能引导 hook 只维护声明式步骤、最后一次启动所有权和 Driver 生命周期，新增复杂流程应拆分'),
  interactionHookBudget('frontend/src/hooks/useFeatureTour.test.ts', 205, '功能引导测试只锁定 StrictMode、并发加载、过期失败和卸载边界'),
  interactionHookBudget('frontend/src/hooks/useFeatureTourPublicApi.test.ts', 90, '功能引导公开接口测试只锁定存储状态、强制启动和位置刷新边界'),
  interactionHookBudget('frontend/src/hooks/useAppPreviewSafeSetters.ts', 35, 'PREVIEW 安全 setter hook 只维护取消待回写和设置模式/SOURCE 的顺序'),
  interactionHookBudget('frontend/src/hooks/useAppPreviewSafeSetters.test.ts', 65, 'PREVIEW 安全 setter 测试只锁定取消待回写先于设置模式和 SOURCE'),
  ...appTelemetryHookMaintainabilityBudgets,
  interactionHookBudget('frontend/src/hooks/useRafCallback.ts', 35, 'RAF 回调 hook 只维护单帧合并调度和 cleanup 取消，不承载具体业务回调'),
  interactionHookBudget('frontend/src/hooks/useRafCallback.test.ts', 85, 'RAF 回调测试只锁定同帧去重、执行后可重排和 cleanup 取消'),
  ...appInteractionScrollbarMaintainabilityBudgets,
];
