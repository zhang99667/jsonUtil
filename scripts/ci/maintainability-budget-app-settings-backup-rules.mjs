const settingsBackupBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appSettingsBackupMaintainabilityBudgets = [
  settingsBackupBudget('frontend/src/utils/appBackup.ts', 290, '配置备份入口只维护格式归一化、存储计划编排和导入结果汇总'),
  settingsBackupBudget('frontend/src/utils/appBackup.test.ts', 175, '配置备份主测试只锁定导入导出格式、敏感配置保留和广播行为'),
  settingsBackupBudget('frontend/src/utils/appBackupFormat.ts', 145, '配置备份格式 helper 只维护 v1 核心结构、能力标记和面板布局兼容边界'),
  settingsBackupBudget('frontend/src/utils/appBackupIntegrity.test.ts', 195, '配置备份完整性测试只锁定读取失败、历史兼容、截断格式和零写入拒绝'),
  settingsBackupBudget('frontend/src/utils/appBackupStorageMutations.ts', 85, '配置备份存储 helper 只维护原值快照、顺序变更和逆序补偿'),
  settingsBackupBudget('frontend/src/utils/appBackupStorageRollback.test.ts', 215, '配置备份补偿测试只锁定完整故障矩阵、零写入快照失败和恢复失败语义'),
  settingsBackupBudget('frontend/src/utils/appSettingsBackupCommandRunner.test.ts', 300, '配置备份命令测试只锁定动态加载、浏览器副作用和失败后的状态隔离'),
  settingsBackupBudget('frontend/src/utils/appSettingsBackupImportCommandError.test.ts', 40, '配置备份导入错误测试只锁定空白异常的中文兜底语义'),
];
