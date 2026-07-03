const interactionHookBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appInteractionHookMaintainabilityBudgets = [
  interactionHookBudget('frontend/src/hooks/useRafCallback.ts', 35, 'RAF 回调 hook 只维护单帧合并调度和 cleanup 取消，不承载具体业务回调'),
  interactionHookBudget('frontend/src/hooks/useRafCallback.test.ts', 85, 'RAF 回调测试只锁定同帧去重、执行后可重排和 cleanup 取消'),
];
