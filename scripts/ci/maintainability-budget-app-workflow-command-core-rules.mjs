import { appWorkflowCommandAutoSaveMaintainabilityBudgets } from './maintainability-budget-app-workflow-command-auto-save-rules.mjs';

const commandCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowCommandCoreMaintainabilityBudgets = [
  ...appWorkflowCommandAutoSaveMaintainabilityBudgets,
  commandCoreBudget('frontend/src/hooks/useAppCopyCommands.ts', 70, '复制命令 hook 只装配复制 runner，并在卸载时使迟到提示和埋点副作用失效'),
  commandCoreBudget('frontend/src/hooks/useAppCopyCommandsConcurrency.test.ts', 105, '连续复制测试锁定最新请求与组件卸载后对提示和埋点副作用的所有权'),
  commandCoreBudget('frontend/src/utils/appCopyCommandRunner.ts', 85, '复制命令 runner 只维护空态、处理中、复制、toast 和打点语义'),
  commandCoreBudget('frontend/src/hooks/useAppPrimaryActionCommand.ts', 47, '主动作命令 hook 只装配 AI 修复、保存、打开和新建标签 runner'),
  commandCoreBudget('frontend/src/hooks/useAppPrimaryActionCommand.test.ts', 60, '主动作命令 hook 测试只锁定动作和当前 effects 委托给 runner'),
  commandCoreBudget('frontend/src/utils/appPrimaryActionCommandRunner.ts', 60, '主动作命令 runner 只维护动作分发、文件动作开始时间和埋点语义'),
  commandCoreBudget('frontend/src/utils/appPrimaryActionCommandRunner.test.ts', 80, '主动作命令 runner 测试只锁定 AI/保存分发、文件动作埋点和未接入动作空转'),
  commandCoreBudget('frontend/src/hooks/useAppPanelLayoutResetCommand.ts', 15, '浮动面板布局重置 hook 只装配 runner 回调'),
  commandCoreBudget('frontend/src/hooks/useAppPanelLayoutResetCommand.test.ts', 35, '浮动面板布局重置 hook 测试只锁定重置动作委托给 runner'),
  commandCoreBudget('frontend/src/utils/appPanelLayoutResetCommandRunner.ts', 15, '浮动面板布局重置 runner 只维护布局缓存清理、重置通知和成功提示'),
  commandCoreBudget('frontend/src/utils/appPanelLayoutResetCommandRunner.test.ts', 40, '浮动面板布局重置 runner 测试只锁定清理、通知和成功提示顺序'),
];
