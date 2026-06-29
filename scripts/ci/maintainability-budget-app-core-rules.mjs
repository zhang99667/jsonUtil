export const appCoreMaintainabilityBudgets = [
  {
    file: 'frontend/src/App.tsx',
    maxLines: 2030,
    reason: '主应用编排文件较大，新增工作流应优先下沉到 hooks 或组件',
  },
  {
    file: 'frontend/src/hooks/useAppAsyncTransform.ts',
    maxLines: 160,
    reason: '主应用异步转换 hook 应只保留 Worker/Promise 编排，纯状态决策继续放在 utils',
  },
  {
    file: 'frontend/src/components/appLazyPanels.ts',
    maxLines: 80,
    reason: '主应用懒加载注册应保持纯加载边界，不夹带业务状态',
  },
  {
    file: 'frontend/src/hooks/layoutKeyboardResize.ts',
    maxLines: 80,
    reason: '布局键盘调整 helper 应保持纯计算，避免夹带组件状态',
  },
  {
    file: 'frontend/src/hooks/useAppFileDrop.ts',
    maxLines: 70,
    reason: '主应用文件拖拽 hook 只维护拖拽计数和文件投递事件，业务处理留在调用方',
  },
];
