const interactionHookBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appInteractionHookMaintainabilityBudgets = [
  interactionHookBudget('frontend/src/hooks/useAppPreviewSafeSetters.ts', 35, 'PREVIEW 安全 setter hook 只维护取消待回写和设置模式/SOURCE 的顺序'),
  interactionHookBudget('frontend/src/hooks/useAppPreviewSafeSetters.test.ts', 65, 'PREVIEW 安全 setter 测试只锁定取消待回写先于设置模式和 SOURCE'),
  interactionHookBudget('frontend/src/hooks/useAppToolTelemetry.ts', 40, '工具事件 telemetry hook 只维护输入大小、耗时分桶和 trackToolEvent 装配'),
  interactionHookBudget('frontend/src/hooks/useAppToolTelemetry.test.ts', 70, '工具事件 telemetry hook 测试只锁定默认状态、耗时计算和 inputRef 当前值读取'),
  interactionHookBudget('frontend/src/hooks/useRafCallback.ts', 35, 'RAF 回调 hook 只维护单帧合并调度和 cleanup 取消，不承载具体业务回调'),
  interactionHookBudget('frontend/src/hooks/useRafCallback.test.ts', 85, 'RAF 回调测试只锁定同帧去重、执行后可重排和 cleanup 取消'),
  interactionHookBudget('frontend/src/hooks/useCustomScrollbar.ts', 110, '通用自定义滚动条 hook 只维护 DOM 尺寸读取、拖拽状态和共享鼠标监听，thumb/拖拽计算留在纯 helper'),
  interactionHookBudget('frontend/src/utils/customScrollbar.ts', 70, '通用自定义滚动条 helper 只维护 thumb 展示和拖拽滚动位置的纯计算'),
  interactionHookBudget('frontend/src/utils/customScrollbar.test.ts', 70, '通用自定义滚动条 helper 测试只锁定不可滚动空态、thumb 边界和拖拽尺寸缺失保护'),
  interactionHookBudget('frontend/src/utils/customScrollbarDom.ts', 55, '通用自定义滚动条 DOM helper 只维护横纵向滚动指标读写和指针位置选择'),
  interactionHookBudget('frontend/src/utils/customScrollbarDom.test.ts', 70, '通用自定义滚动条 DOM helper 测试只锁定横纵向指标读取、指针位置和滚动位置写回'),
];
