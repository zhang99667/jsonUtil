const fileSystemBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appFileSystemMaintainabilityBudgets = [
  fileSystemBudget('frontend/src/hooks/useFileSystem.ts', 640, '文件系统 hook 应只维护标签、打开保存和草稿恢复编排，SOURCE/Mode 写入顺序留在专用 helper'),
  fileSystemBudget('frontend/src/hooks/useFileSystem.test.ts', 150, '文件系统 hook 测试只锁定 SOURCE/Mode 替换前取消 PREVIEW 待回写的关键入口'),
  fileSystemBudget('frontend/src/utils/workspaceSourceState.ts', 35, '工作区 SOURCE 状态 helper 应只维护 before-change、setInput、ref 和 mode 的写入顺序'),
  fileSystemBudget('frontend/src/utils/workspaceSourceState.test.ts', 55, '工作区 SOURCE 状态测试只锁定写入顺序和无模式写入分支'),
];
