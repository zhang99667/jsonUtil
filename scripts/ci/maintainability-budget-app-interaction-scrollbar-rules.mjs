const interactionScrollbarBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appInteractionScrollbarMaintainabilityBudgets = [
  interactionScrollbarBudget('frontend/src/hooks/useCustomScrollbar.ts', 110, '通用自定义滚动条 hook 只维护 DOM 尺寸读取、拖拽状态和共享鼠标监听，thumb/拖拽计算留在纯 helper'),
  interactionScrollbarBudget('frontend/src/utils/customScrollbar.ts', 70, '通用自定义滚动条 helper 只维护 thumb 展示和拖拽滚动位置的纯计算'),
  interactionScrollbarBudget('frontend/src/utils/customScrollbar.test.ts', 70, '通用自定义滚动条 helper 测试只锁定不可滚动空态、thumb 边界和拖拽尺寸缺失保护'),
  interactionScrollbarBudget('frontend/src/utils/customScrollbarDom.ts', 55, '通用自定义滚动条 DOM helper 只维护横纵向滚动指标读写和指针位置选择'),
  interactionScrollbarBudget('frontend/src/utils/customScrollbarDom.test.ts', 70, '通用自定义滚动条 DOM helper 测试只锁定横纵向指标读取、指针位置和滚动位置写回'),
];
