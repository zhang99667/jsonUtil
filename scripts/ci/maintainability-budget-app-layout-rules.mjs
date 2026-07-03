const layoutBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appLayoutMaintainabilityBudgets = [
  layoutBudget('frontend/src/hooks/useAppLayoutController.ts', 55, '主应用布局 controller 只装配 useLayout 状态和键盘 resize handler'),
  layoutBudget('frontend/src/hooks/useAppLayoutController.test.ts', 90, '主应用布局 controller 测试只锁定布局状态透传和键盘 resize 行为'),
  layoutBudget('frontend/src/hooks/useLayout.ts', 45, '底层布局 hook 只维护布局状态和拖拽 hook 装配，鼠标监听与尺寸计算不得回流'),
  layoutBudget('frontend/src/hooks/useLayoutResizeDrag.ts', 80, '布局鼠标拖拽 hook 只维护开始/停止拖拽、mousemove 更新和窗口监听装配'),
  layoutBudget('frontend/src/hooks/useLayoutResizeDrag.test.ts', 100, '布局鼠标拖拽 hook 测试只锁定开始/停止、激活状态和鼠标更新行为'),
  layoutBudget('frontend/src/hooks/layoutResizeDragUpdate.ts', 60, '布局鼠标拖拽更新 helper 只维护侧栏/分栏更新分发，不承载 React 生命周期'),
  layoutBudget('frontend/src/hooks/layoutResizeDragUpdate.test.ts', 85, '布局鼠标拖拽更新测试只锁定侧栏更新、分栏更新和缺少容器兜底'),
  layoutBudget('frontend/src/hooks/useWindowMouseDragListeners.ts', 35, '窗口鼠标拖拽监听 hook 只负责 mousemove/mouseup 挂载和清理，不承载拖拽计算'),
  layoutBudget('frontend/src/hooks/useWindowMouseDragListeners.test.ts', 65, '窗口鼠标拖拽监听测试只锁定未激活不挂载和 cleanup 移除监听'),
  layoutBudget('frontend/src/hooks/layoutResize.ts', 55, '布局鼠标拖拽 helper 应保持纯计算，避免夹带组件状态'),
  layoutBudget('frontend/src/hooks/layoutResize.test.ts', 55, '布局鼠标拖拽 helper 测试只锁定 clamp、侧栏宽度和分栏百分比计算'),
  layoutBudget('frontend/src/hooks/layoutKeyboardResize.ts', 95, '布局键盘调整 helper 应集中维护按键计算和 preventDefault/状态写入分发，不承载 React 生命周期'),
  layoutBudget('frontend/src/hooks/layoutKeyboardResize.test.ts', 80, '布局键盘调整测试只锁定按键计算、边界收敛和状态写入分发'),
];
