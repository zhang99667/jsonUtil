const interactionHookBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appInteractionHookMaintainabilityBudgets = [
  interactionHookBudget('frontend/src/hooks/useRafCallback.ts', 35, 'RAF 回调 hook 只维护单帧合并调度和 cleanup 取消，不承载具体业务回调'),
  interactionHookBudget('frontend/src/hooks/useRafCallback.test.ts', 85, 'RAF 回调测试只锁定同帧去重、执行后可重排和 cleanup 取消'),
  interactionHookBudget('frontend/src/hooks/useCustomScrollbar.ts', 110, '通用自定义滚动条 hook 只维护 DOM 尺寸读取、拖拽状态和共享鼠标监听，thumb/拖拽计算留在纯 helper'),
  interactionHookBudget('frontend/src/utils/customScrollbar.ts', 70, '通用自定义滚动条 helper 只维护 thumb 展示和拖拽滚动位置的纯计算'),
  interactionHookBudget('frontend/src/utils/customScrollbar.test.ts', 70, '通用自定义滚动条 helper 测试只锁定不可滚动空态、thumb 边界和拖拽尺寸缺失保护'),
];
