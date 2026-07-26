import { appSettingsModalMaintainabilityBudgets } from './maintainability-budget-app-settings-modal-rules.mjs';

const appComponentBudget = (file, maxLines, reason) => ({
  file: `frontend/src/components/${file}`,
  maxLines,
  reason,
});

export const appComponentMaintainabilityBudgets = [
  appComponentBudget('AppConfirmDialogs.tsx', 140, '主工作台确认弹窗组件只装配确认文案和回调，业务状态应留在 App 或纯 helper'),
  appComponentBudget('EditorHeaderActions.tsx', 160, '编辑器头部按钮组只承载 SOURCE/PREVIEW 展示动作，业务判断和按钮壳应继续留在派生状态或专用组件'),
  appComponentBudget('EditorHeaderActionButton.tsx', 80, '编辑器头部按钮壳只承载通用 button、图标路径和可访问性属性映射'),
  appComponentBudget('EditorHeaderActions.test.tsx', 130, '编辑器头部按钮测试只锁定 tour、标题、禁用和 pressed 语义，避免重复覆盖编辑器装配细节'),
  appComponentBudget('TabBar.tsx', 235, '标签栏只维护文件标签、键盘导航、关闭入口和横向滚动条装配'),
  appComponentBudget('TabBar.test.tsx', 145, '标签栏测试只锁定可访问名称、键盘导航、关闭和滚动条装配'),
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
  appComponentBudget('AppToastHost.tsx', 45, '主应用提示宿主只维护位置、命名队列和卸载时的定向清理'),
  appComponentBudget('AppToastHost.test.tsx', 110, '提示宿主测试只锁定默认队列、命名队列透传和定向清理'),
  appComponentBudget('NativeDialog.tsx', 85, '原生对话框只按需装配成熟焦点陷阱，并维护打开、入口焦点恢复、取消与遮罩关闭契约'),
  appComponentBudget('DraggablePanel.tsx', 410, '浮动面板只编排成熟拖拽缩放组件、持久化、视口夹取和焦点契约，不回流手写指针状态机'),
  appComponentBudget('DraggablePanel.test.ts', 115, '浮动面板测试只锁定视口夹取、焦点、退出键和成熟组件位置提交契约'),
  ...appSettingsModalMaintainabilityBudgets,
  appComponentBudget('AppFileDropOverlay.tsx', 35, '主工作台文件拖拽浮层只承载释放提示图标和文案，不承载拖拽状态'),
  appComponentBudget('appLazyPanels.ts', 80, '主应用懒加载注册应保持纯加载边界，不夹带业务状态'),
];
