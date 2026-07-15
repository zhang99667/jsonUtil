const fileSystemHookTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appFileSystemHookTestMaintainabilityBudgets = [
  fileSystemHookTestBudget('frontend/src/hooks/useFileSystem.test.ts', 130, '文件系统 hook 测试只锁定 SOURCE 和标签编排，打开、保存与自动保存边界留在专用测试'),
  fileSystemHookTestBudget('frontend/src/hooks/useFileSystemConcurrency.test.ts', 310, '文件系统并发测试模拟 React 工作区状态队列，锁定打开、新建、切换、保存和关闭的交错组合语义'),
  fileSystemHookTestBudget('frontend/src/hooks/useFileSystemOpen.test.ts', 275, '文件打开测试集中锁定取消与空输入、异步实时合并、批量部分失败、请求次序、模式提交和无标签草稿意图保护'),
  fileSystemHookTestBudget('frontend/src/hooks/useFileAutoSave.test.ts', 220, '文件自动保存测试只锁定快照、防抖依赖、手动取消、句柄替换以及写入成功和失败语义'),
  fileSystemHookTestBudget('frontend/src/hooks/useWorkspaceDraftPersistence.test.ts', 215, '工作区草稿持久化测试锁定恢复、首轮跳过、失败提示去重和监听清理'),
  fileSystemHookTestBudget('frontend/src/hooks/useWorkspaceDraftPersistenceCommitWindow.test.ts', 135, '工作区草稿提交窗口测试只锁定布局提交后、被动副作用前的紧急落盘快照'),
  fileSystemHookTestBudget('frontend/src/hooks/useFileSystemSave.test.ts', 295, '文件系统保存边界测试覆盖选择器取消、下载回退、写入错误、保存期间编辑或切换标签以及同标签另存乱序语义'),
  fileSystemHookTestBudget('frontend/src/hooks/fileSystemTestState.ts', 35, '文件系统测试状态 helper 只构造和归并 React 工作区状态更新，不复制生产状态规则'),
];
