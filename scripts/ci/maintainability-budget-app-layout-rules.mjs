export const appLayoutMaintainabilityBudgets = [
  {
    file: 'frontend/src/hooks/useAppLayoutController.ts',
    maxLines: 55,
    reason: '主应用布局 controller 只装配 useLayout 状态和键盘 resize handler',
  },
  {
    file: 'frontend/src/hooks/useAppLayoutController.test.ts',
    maxLines: 90,
    reason: '主应用布局 controller 测试只锁定布局状态透传和键盘 resize 行为',
  },
  {
    file: 'frontend/src/hooks/useLayout.ts',
    maxLines: 70,
    reason: '底层布局 hook 只维护拖拽 resize 状态、全局鼠标监听和布局尺寸 clamp',
  },
  {
    file: 'frontend/src/hooks/layoutKeyboardResize.ts',
    maxLines: 80,
    reason: '布局键盘调整 helper 应保持纯计算，避免夹带组件状态',
  },
];
