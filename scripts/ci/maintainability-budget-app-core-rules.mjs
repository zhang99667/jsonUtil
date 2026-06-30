export const appCoreMaintainabilityBudgets = [
  {
    file: 'frontend/src/App.tsx',
    maxLines: 1130,
    reason: '主应用编排文件应只负责顶层状态和组件装配，PREVIEW 同步、SOURCE 校验、模板填充、懒加载 loaded 状态、命令工作流和派生状态不得回流',
  },
  {
    file: 'frontend/src/hooks/useAppAsyncTransform.ts',
    maxLines: 160,
    reason: '主应用异步转换 hook 应只保留 Worker/Promise 编排，纯状态决策继续放在 utils',
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
  {
    file: 'frontend/src/hooks/useAppSourceValidation.ts',
    maxLines: 55,
    reason: '主应用 SOURCE 校验 hook 应只维护输入防抖、旧请求取消和校验结果防串写',
  },
];
