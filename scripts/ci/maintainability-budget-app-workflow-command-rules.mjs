export const appWorkflowCommandMaintainabilityBudgets = [
  { file: 'frontend/src/hooks/useAppCopyCommands.ts', maxLines: 65, reason: '复制命令 hook 只接 SOURCE/PREVIEW 文本和复制 runner，副作用分支留在可测 helper' },
  { file: 'frontend/src/utils/appCopyCommandRunner.ts', maxLines: 85, reason: '复制命令 runner 只维护空态、处理中、复制、toast 和打点语义' },
  { file: 'frontend/src/hooks/useAppSettingsBackupCommands.ts', maxLines: 90, reason: '设置备份 hook 只负责动态加载备份模块、下载文件和状态写回依赖装配' },
  { file: 'frontend/src/utils/appSettingsBackupCommandRunner.ts', maxLines: 110, reason: '设置备份 runner 只维护导出/导入副作用顺序和错误提示语义' },
  { file: 'frontend/src/hooks/useAppSmartSuggestionCommands.ts', maxLines: 95, reason: '智能建议命令 hook 只装配模式、面板和 toast 副作用，计划逻辑留在 runner/helper' },
  { file: 'frontend/src/utils/appSmartSuggestionCommandEffects.ts', maxLines: 75, reason: '智能建议 effects helper 只装配 App 回调到 runner 副作用，不承载建议计划逻辑' },
  { file: 'frontend/src/utils/appSmartSuggestionCommandEffects.test.ts', maxLines: 90, reason: '智能建议 effects 测试只锁定 Scheme request 自增和副作用回调映射' },
  { file: 'frontend/src/utils/appSmartSuggestionCommandRunner.ts', maxLines: 95, reason: '智能建议命令 runner 只执行计划副作用顺序和埋点语义' },
  { file: 'frontend/src/hooks/useAppTemplateFillCommand.ts', maxLines: 125, reason: '模板填充命令 hook 只维护目标校验、模板应用、质量 delta 和竞态保护' },
];
