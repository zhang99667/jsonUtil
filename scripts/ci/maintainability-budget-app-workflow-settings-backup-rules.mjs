export const appWorkflowSettingsBackupMaintainabilityBudgets = [
  { file: 'frontend/src/hooks/useAppSettingsBackupCommands.ts', maxLines: 90, reason: '设置备份 hook 只负责动态加载备份模块、下载文件和状态写回依赖装配' },
  { file: 'frontend/src/utils/appSettingsBackupBrowserEffects.ts', maxLines: 55, reason: '设置备份浏览器副作用 adapter 只维护动态加载、文件读取、下载链接和本地存储入口' },
  { file: 'frontend/src/utils/appSettingsBackupBrowserEffects.test.ts', maxLines: 85, reason: '设置备份浏览器下载副作用测试只锁定临时链接创建和清理兜底' },
  { file: 'frontend/src/utils/appSettingsBackupBrowserAccess.test.ts', maxLines: 55, reason: '设置备份浏览器访问测试只锁定动态模块加载、文件读取和存储入口' },
  { file: 'frontend/src/utils/appSettingsBackupCommandRunner.ts', maxLines: 20, reason: '设置备份 runner 只作为导出/导入命令和类型的兼容出口' },
  { file: 'frontend/src/utils/appSettingsBackupExportCommand.ts', maxLines: 55, reason: '设置备份导出命令只维护备份构造、文件下载和导出错误提示语义' },
  { file: 'frontend/src/utils/appSettingsBackupImportCommand.ts', maxLines: 55, reason: '设置备份导入命令只维护文件读取、状态写回、导入事件和导入错误提示语义' },
  { file: 'frontend/src/utils/appSettingsBackupCommandRunnerTypes.ts', maxLines: 60, reason: '设置备份命令类型契约只维护导出/导入模块、文件和 effects 形状' },
];
