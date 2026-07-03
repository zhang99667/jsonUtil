import { appWorkflowCommandAutoSaveMaintainabilityBudgets } from './maintainability-budget-app-workflow-command-auto-save-rules.mjs';

const commandCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowCommandCoreMaintainabilityBudgets = [
  ...appWorkflowCommandAutoSaveMaintainabilityBudgets,
  commandCoreBudget('frontend/src/hooks/useAppCopyCommands.ts', 65, '复制命令 hook 只接 SOURCE/PREVIEW 文本和复制 runner，副作用分支留在可测 helper'),
  commandCoreBudget('frontend/src/utils/appCopyCommandRunner.ts', 85, '复制命令 runner 只维护空态、处理中、复制、toast 和打点语义'),
  commandCoreBudget('frontend/src/hooks/useAppPrimaryActionCommand.ts', 55, '主动作命令 hook 只装配 AI 修复、保存、打开和新建标签 runner'),
  commandCoreBudget('frontend/src/hooks/useAppPrimaryActionCommand.test.ts', 90, '主动作命令 hook 测试只锁定动作分发和文件动作埋点'),
  commandCoreBudget('frontend/src/utils/appPrimaryActionCommandRunner.ts', 60, '主动作命令 runner 只维护动作分发、文件动作开始时间和埋点语义'),
  commandCoreBudget('frontend/src/hooks/useAppSmartSuggestionCommands.ts', 95, '智能建议命令 hook 只装配模式、面板和 toast 副作用，计划逻辑留在 runner/helper'),
  commandCoreBudget('frontend/src/hooks/useAppSmartSuggestionCommands.test.ts', 120, '智能建议命令 hook 测试只锁定 runner 输入和调用方 effects 接线'),
  commandCoreBudget('frontend/src/utils/appSmartSuggestionCommandRunner.ts', 75, '智能建议命令 runner 只维护计划分支、模式切换、提示和埋点语义'),
  commandCoreBudget('frontend/src/utils/appSmartSuggestionPlanEffects.ts', 75, '智能建议计划副作用 helper 只维护 effect 名称到面板、输入和高亮副作用的固定顺序映射'),
  commandCoreBudget('frontend/src/utils/appSmartSuggestionPlanEffects.test.ts', 90, '智能建议计划副作用测试只锁定执行顺序、Scheme 输入和面板打开状态'),
];
