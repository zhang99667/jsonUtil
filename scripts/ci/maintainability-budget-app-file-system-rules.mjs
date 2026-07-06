const fileSystemBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appFileSystemMaintainabilityBudgets = [
  fileSystemBudget('frontend/src/hooks/useFileSystem.ts', 640, '文件系统 hook 应只维护标签、打开保存和草稿恢复编排，SOURCE/Mode 写入顺序留在专用 helper'),
  fileSystemBudget('frontend/src/hooks/useFileSystem.test.ts', 140, '文件系统 hook 测试只锁定 SOURCE/Mode 替换前取消 PREVIEW 待回写的关键入口，重复写回断言应收敛到本地 helper'),
  fileSystemBudget('frontend/src/utils/workspaceFileTabs.ts', 45, '工作区文件标签 helper 应只维护 Untitled 命名和关闭标签后选择下一个活动标签的纯规则'),
  fileSystemBudget('frontend/src/utils/workspaceFileTabs.test.ts', 65, '工作区文件标签测试只锁定 Untitled 编号和关闭标签选择规则'),
  fileSystemBudget('frontend/src/utils/workspaceStandaloneDraftFile.ts', 45, '工作区无标签输入草稿 helper 应只维护 standalone input 转未保存标签的纯规则'),
  fileSystemBudget('frontend/src/utils/workspaceStandaloneDraftFile.test.ts', 65, '工作区无标签输入草稿测试只覆盖跳过条件和 Untitled 草稿生成'),
  fileSystemBudget('frontend/src/utils/workspaceSourceState.ts', 35, '工作区 SOURCE 状态 helper 应只维护 before-change、setInput、ref 和 mode 的写入顺序'),
  fileSystemBudget('frontend/src/utils/workspaceSourceState.test.ts', 55, '工作区 SOURCE 状态测试只锁定写入顺序和无模式写入分支'),
];
