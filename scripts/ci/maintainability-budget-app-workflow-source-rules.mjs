export const appWorkflowSourceMaintainabilityBudgets = [
  { file: 'frontend/src/utils/appSourceReplacePlans.ts', maxLines: 120, reason: 'SOURCE 替换入口应只保留场景文案和特殊条件，通用替换决策留在 core helper' },
  { file: 'frontend/src/utils/appSourceReplacePlanCore.ts', maxLines: 80, reason: 'SOURCE 替换通用决策应保持纯计划输出，副作用留在 App 主入口' },
  { file: 'frontend/src/hooks/useAppSourceReplacementCommands.ts', maxLines: 145, reason: 'SOURCE 替换 hook 只装配粘贴、Scheme、预览和 Schema 命令，场景命令状态留在专用 hook' },
  { file: 'frontend/src/hooks/useAppApplySourceReplacementCommands.ts', maxLines: 110, reason: '应用 PREVIEW/Schema 到 SOURCE hook 只维护 pending 替换确认、场景 event 和打点' },
  { file: 'frontend/src/hooks/useAppPasteSourceCommand.ts', maxLines: 90, reason: '粘贴 SOURCE hook 只维护剪贴板读取、pending 替换确认、错误提示和打点' },
  { file: 'frontend/src/hooks/useAppSchemeInspectSourceCommand.ts', maxLines: 80, reason: 'Scheme 排查 SOURCE hook 只维护 Scheme 原始值替换、面板复位回调接入和打点语义' },
  { file: 'frontend/src/hooks/useAppClearSourceCommands.ts', maxLines: 70, reason: '清空 SOURCE hook 只维护确认弹窗状态、清空写入、提示和打点' },
  { file: 'frontend/src/hooks/useAppSourceApplyEffects.ts', maxLines: 90, reason: 'SOURCE 应用副作用 hook 只维护写入 SOURCE、Scheme 面板复位和剪贴板智能建议来源' },
  { file: 'frontend/src/utils/appSourceReplacementCommandHelpers.ts', maxLines: 100, reason: 'SOURCE 替换 command helper 只维护计划分发、pending 确认和取消打点共用语义' },
];
