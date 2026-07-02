const appComponentBudget = (file, maxLines, reason) => ({
  file: `frontend/src/components/${file}`,
  maxLines,
  reason,
});

export const appComponentMaintainabilityBudgets = [
  appComponentBudget('AppConfirmDialogs.tsx', 140, '主工作台确认弹窗组件只装配确认文案和回调，业务状态应留在 App 或纯 helper'),
  appComponentBudget('EditorHeaderActions.tsx', 210, '编辑器头部按钮组件只承载 SOURCE/PREVIEW 展示动作，业务判断应继续留在 App 派生状态'),
  appComponentBudget('AppToolPanelsController.tsx', 210, '主工作台工具面板 controller 只负责 App 顶层状态到懒加载面板 props 的等价装配'),
  appComponentBudget('AppToolPanelsController.test.tsx', 210, '工具面板 controller 测试应只覆盖 props 透传、关闭动作和 SOURCE 写入回调'),
  appComponentBudget('AppLazyToolPanels.tsx', 65, '主工作台懒加载工具面板组件只负责 lazy 面板装配，类型契约和状态语义应留在独立模块或 App'),
  appComponentBudget('AppLazyToolPanelsTypes.ts', 45, '主工作台懒加载工具面板类型契约应独立维护，避免面板装配文件因 props 类型贴线'),
  appComponentBudget('AppLazyPanelSlot.tsx', 30, '主工作台懒加载面板插槽只承载 loaded 判断和空 fallback Suspense 包裹'),
  appComponentBudget('AppLazyShellModals.tsx', 60, '主工作台全局懒加载弹窗壳只负责 settings/changelog 装配，不承载业务状态'),
  appComponentBudget('AppResizeHandles.tsx', 90, '主工作台调整手柄组件只承载 ARIA、样式和事件转发，尺寸状态应留在 App'),
  appComponentBudget('AppResizeSeparator.tsx', 60, '主工作台 resize separator 只承载公共 ARIA、样式、鼠标和键盘事件透传'),
  appComponentBudget('AppResizeHandles.test.tsx', 90, '主工作台调整手柄测试只锁定隐藏状态、ARIA 数值和定位样式'),
  appComponentBudget('AppWorkspaceOverlays.tsx', 25, '主工作台遮罩层组件只负责交互遮罩组和 Toast 宿主装配，文件/布局状态应留在 App'),
  appComponentBudget('AppInteractionOverlays.tsx', 25, '主工作台交互遮罩组只负责 resize 捕获层和文件拖拽浮层条件装配'),
  appComponentBudget('AppResizeCaptureOverlay.tsx', 20, '主工作台 resize 捕获层只承载全屏鼠标捕获样式，不承载布局状态'),
  appComponentBudget('AppToastHost.tsx', 25, '主应用 Toast 宿主只承载全局 toast 位置和展示偏移配置'),
  appComponentBudget('AppFileDropOverlay.tsx', 35, '主工作台文件拖拽浮层只承载释放提示图标和文案，不承载拖拽状态'),
  appComponentBudget('appLazyPanels.ts', 80, '主应用懒加载注册应保持纯加载边界，不夹带业务状态'),
];
