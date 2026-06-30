const appComponentBudget = (file, maxLines, reason) => ({
  file: `frontend/src/components/${file}`,
  maxLines,
  reason,
});

export const appComponentMaintainabilityBudgets = [
  appComponentBudget('AppConfirmDialogs.tsx', 140, '主工作台确认弹窗组件只装配确认文案和回调，业务状态应留在 App 或纯 helper'),
  appComponentBudget('EditorHeaderActions.tsx', 210, '编辑器头部按钮组件只承载 SOURCE/PREVIEW 展示动作，业务判断应继续留在 App 派生状态'),
  appComponentBudget('AppLazyToolPanels.tsx', 85, '主工作台懒加载工具面板组件只负责 lazy 面板装配，状态和事件语义应留在 App'),
  appComponentBudget('AppLazyPanelSlot.tsx', 30, '主工作台懒加载面板插槽只承载 loaded 判断和空 fallback Suspense 包裹'),
  appComponentBudget('AppLazyShellModals.tsx', 60, '主工作台全局懒加载弹窗壳只负责 settings/changelog 装配，不承载业务状态'),
  appComponentBudget('AppResizeHandles.tsx', 90, '主工作台调整手柄组件只承载 ARIA、样式和事件转发，尺寸状态应留在 App'),
  appComponentBudget('AppWorkspaceOverlays.tsx', 25, '主工作台遮罩层组件只负责交互遮罩组和 Toast 宿主装配，文件/布局状态应留在 App'),
  appComponentBudget('AppInteractionOverlays.tsx', 25, '主工作台交互遮罩组只负责 resize 捕获层和文件拖拽浮层条件装配'),
  appComponentBudget('AppResizeCaptureOverlay.tsx', 20, '主工作台 resize 捕获层只承载全屏鼠标捕获样式，不承载布局状态'),
  appComponentBudget('AppToastHost.tsx', 25, '主应用 Toast 宿主只承载全局 toast 位置和展示偏移配置'),
  appComponentBudget('AppFileDropOverlay.tsx', 35, '主工作台文件拖拽浮层只承载释放提示图标和文案，不承载拖拽状态'),
  appComponentBudget('appLazyPanels.ts', 80, '主应用懒加载注册应保持纯加载边界，不夹带业务状态'),
];
