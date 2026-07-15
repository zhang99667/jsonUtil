const fileSystemCommandBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appFileSystemCommandMaintainabilityBudgets = [
  fileSystemCommandBudget('frontend/src/hooks/fileOpenCommands.ts', 220, '文件打开命令只维护选择器回退、批量读取、格式导入、部分失败和请求竞态，不承载保存或标签生命周期'),
  fileSystemCommandBudget('frontend/src/hooks/useFileSaveCommands.ts', 215, '文件保存命令只维护另存、句柄写入、快照确认和保存竞态，不承载文件打开或标签切换'),
];
