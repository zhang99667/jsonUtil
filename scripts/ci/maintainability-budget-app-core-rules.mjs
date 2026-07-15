import { appFileCloseMaintainabilityBudgets } from './maintainability-budget-app-file-close-rules.mjs';
import { appFileSystemMaintainabilityBudgets } from './maintainability-budget-app-file-system-rules.mjs';
import { appInteractionHookMaintainabilityBudgets } from './maintainability-budget-app-interaction-hook-rules.mjs';
import { appLayoutMaintainabilityBudgets } from './maintainability-budget-app-layout-rules.mjs';
import { appSourceValidationMaintainabilityBudgets } from './maintainability-budget-app-source-validation-rules.mjs';

export const appCoreMaintainabilityBudgets = [
  {
    file: 'frontend/src/App.tsx',
    maxLines: 960,
    reason: '主应用编排文件应只负责顶层状态和组件装配，PREVIEW 同步、SOURCE 校验、模板填充、工具面板命令、文件关闭保护、布局键盘控制、懒加载 loaded 状态和派生状态不得回流',
  },
  ...appFileSystemMaintainabilityBudgets,
  ...appInteractionHookMaintainabilityBudgets,
  ...appLayoutMaintainabilityBudgets,
  {
    file: 'frontend/src/hooks/useAppAsyncTransform.ts',
    maxLines: 160,
    reason: '主应用异步转换 hook 只维护 Worker/Promise 编排、单次终态与有界等待，纯状态决策继续放在 utils',
  },
  {
    file: 'frontend/src/hooks/useAppAsyncTransform.test.ts',
    maxLines: 315,
    reason: '异步转换 hook 测试集中锁定 Worker 构造、发送、超时、协议异常、结算、回收和晚到回调边界',
  },
  {
    file: 'frontend/src/hooks/useAppFileDrop.ts',
    maxLines: 70,
    reason: '主应用文件拖拽 hook 只维护拖拽计数和文件投递事件，业务处理留在调用方',
  },
  ...appFileCloseMaintainabilityBudgets,
  ...appSourceValidationMaintainabilityBudgets,
];
